import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { WhatsappGateway } from '../../infrastructure/gateways/whatsapp.gateway';

interface SessionState {
  client: Client;
  isReady: boolean;
  latestQr: string;
  connectionStatus: 'DISCONNECTED' | 'LOADING' | 'CONNECTED';
}

@Injectable()
export class WhatsappService {
  private usersSessions = new Map<number, SessionState>();
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly whatsappGateway: WhatsappGateway) {}

  async getOrCreateClient(userId: number): Promise<Client> {
    if (this.usersSessions.has(userId)) {
      return this.usersSessions.get(userId)!.client;
    }

    this.logger.log(
      `Creando instancia aislada de WhatsApp Web para el usuario dueño: ${userId}`,
    );

    const sessionState: SessionState = {
      client: new Client({
        authStrategy: new LocalAuth({
          clientId: `session_user_${userId}`,
        }),
        puppeteer: {
          headless: true, // Forzamos ejecución eficiente en segundo plano
          protocolTimeout: 60000, // MEJORA: Damos 60 segundos de tolerancia a Puppeteer para evitar el freeze
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-programmatic-navigation',
          ],
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false,
        },
      }),
      isReady: false,
      latestQr: '',
      connectionStatus: 'LOADING',
    };

    this.usersSessions.set(userId, sessionState);
    this.setupClientListeners(userId, sessionState);

    sessionState.client.initialize().catch((err) => {
      this.logger.error(
        `Error inicializando cliente de WhatsApp para usuario ${userId}:`,
        err.message,
      );
    });

    return sessionState.client;
  }

  private setupClientListeners(userId: number, state: SessionState) {
    const { client } = state;

    client.on('qr', (qr) => {
      state.latestQr = qr;
      state.connectionStatus = 'DISCONNECTED';
      state.isReady = false;

      this.logger.log(
        `[Usuario ${userId}] Nuevo código QR generado. Escanea para vincular:`,
      );
      qrcode.generate(qr, { small: true });

      this.whatsappGateway.emitStatus({ userId, status: 'DISCONNECTED' });
      this.whatsappGateway.emitQrCode({ userId, qr });
    });

    client.on('ready', () => {
      state.latestQr = '';
      state.connectionStatus = 'CONNECTED';
      state.isReady = true;

      this.logger.log(
        `¡Conexión exitosa! El WhatsApp del usuario ${userId} está listo.`,
      );
      this.whatsappGateway.emitStatus({ userId, status: 'CONNECTED' });
    });

    client.on('auth_failure', (msg) => {
      state.latestQr = '';
      state.connectionStatus = 'DISCONNECTED';
      state.isReady = false;
      this.logger.error(
        `Error de autenticación de WhatsApp para usuario ${userId}: ${msg}`,
      );
      this.whatsappGateway.emitStatus({ userId, status: 'DISCONNECTED' });
    });

    client.on('disconnected', async (reason) => {
      state.latestQr = '';
      state.connectionStatus = 'DISCONNECTED';
      state.isReady = false;

      this.logger.warn(
        `[Usuario ${userId}] WhatsApp desvinculado desde el dispositivo. Razón: ${reason}`,
      );

      this.whatsappGateway.emitStatus({ userId, status: 'DISCONNECTED' });

      // CANDADO DE ELIMINACIÓN DE LISTENERS: Removemos de inmediato todos los hilos
      // de eventos internos del cliente moribundo para apagar los scripts asíncronos
      // inyectados de whatsapp-web.js antes de que intenten evaluar ventanas inexistentes.
      try {
        client.removeAllListeners('incoming_call');
        client.removeAllListeners('auth_failure');
        client.removeAllListeners('ready');
        // Dejamos que la cola de ejecución ignore eventos huérfanos de Puppeteer
      } catch (e) {}

      setTimeout(async () => {
        try {
          if (this.usersSessions.has(userId)) {
            this.logger.log(
              `[Usuario ${userId}] Removiendo sesión huérfana de forma segura...`,
            );

            // 1. Lo sacamos del mapa en memoria para blindar llamadas concurrentes
            this.usersSessions.delete(userId);

            // 2. Destruimos el cliente absorbiendo pacíficamente cualquier pánico interno
            await client.destroy().catch(() => {});

            this.logger.log(
              `[Usuario ${userId}] Instancia purgada de la memoria.`,
            );
          }
        } catch (err) {
          // Captura silenciosa por si Puppeteer protesta al cerrar hilos fantasmas
        }
      }, 500);
    });
  }

  getSyncStatus(userId: number) {
    const state = this.usersSessions.get(userId);
    if (!state) {
      this.getOrCreateClient(userId);
      return { status: 'DISCONNECTED', qr: '' };
    }

    const currentStatus =
      state.connectionStatus === 'LOADING' && state.latestQr
        ? 'DISCONNECTED'
        : state.connectionStatus;

    return {
      status: currentStatus,
      qr: state.latestQr,
    };
  }

  async sendMessage(userId: number, phoneNumber: string, message: string) {
    const state = this.usersSessions.get(userId);
    if (!state || !state.isReady) {
      this.logger.warn(
        `Envío abortado: El WhatsApp del usuario ${userId} no está listo.`,
      );
      return;
    }

    try {
      const cleanedNumber = phoneNumber.replace(/\D/g, '');
      const finalNumber = `${cleanedNumber}@c.us`;

      await state.client.sendMessage(finalNumber, message);
      this.logger.log(
        `Mensaje enviado por el usuario ${userId} hacia: ${phoneNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando WhatsApp desde usuario ${userId}:`,
        error.message,
      );
    }
  }

  async logoutSession(userId: number) {
    const state = this.usersSessions.get(userId);
    if (!state) return;

    this.logger.warn(
      `[Usuario ${userId}] Cerrando sesión de WhatsApp solicitada desde la web...`,
    );
    state.connectionStatus = 'LOADING';
    this.whatsappGateway.emitStatus({ userId, status: 'LOADING' });

    try {
      // 1. Removemos del mapa primero para bloquear operaciones simultáneas
      this.usersSessions.delete(userId);

      // 2. Apagamos los listeners para evitar ruidos de Puppeteer
      try {
        state.client.removeAllListeners('incoming_call');
        state.client.removeAllListeners('auth_failure');
        state.client.removeAllListeners('ready');
      } catch (e) {}

      // 3. Solicitamos el cierre formal a los servidores de WhatsApp y destruimos el navegador
      await state.client.logout().catch(() => {});
      await state.client.destroy().catch(() => {});

      this.logger.log(`[Usuario ${userId}] Sesión web destruida con éxito.`);
    } catch (error) {
      this.logger.error(
        `Error destruyendo cliente de WhatsApp en logout del usuario ${userId}:`,
        error.message,
      );
    }

    setTimeout(async () => {
      this.logger.log(
        `[Usuario ${userId}] Inicializando nueva instancia limpia post-logout...`,
      );
      await this.getOrCreateClient(userId).catch(() => {});
    }, 1000);
  }
}
