import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Permite la conexión desde tu frontend de Angular
  },
  namespace: 'whatsapp',
})
@Injectable()
export class WhatsappGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private activeClients = 0;

  handleConnection(client: Socket) {
    this.activeClients++;
    console.log(
      `[WebSocket] Cliente Angular conectado a WhatsApp Gateway. Activos: ${this.activeClients}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.activeClients--;
    console.log(
      `[WebSocket] Cliente Angular desconectado. Activos: ${this.activeClients}`,
    );
  }

  /**
   * Envía el código QR en tiempo real empaquetando el identificador del dueño correspondiente
   */
  emitQrCode(data: { userId: number; qr: string }) {
    this.server.emit('qr_code', data);
  }

  /**
   * Envía las mutaciones de estado empaquetando el identificador del dueño correspondiente
   */
  emitStatus(data: {
    userId: number;
    status: 'DISCONNECTED' | 'LOADING' | 'CONNECTED';
  }) {
    this.server.emit('connection_status', data);
  }
}
