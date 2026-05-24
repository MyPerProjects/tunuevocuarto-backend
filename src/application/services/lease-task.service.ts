import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LeaseRepository } from '../../infrastructure/persistence/lease.repository';
import { WhatsappService } from './whatsapp.service';
import { WhatsappTemplatesHelper } from '../helpers/whatsapp-template.helper';

@Injectable()
export class LeaseTaskService {
  private readonly logger = new Logger(LeaseTaskService.name);

  constructor(
    private readonly leaseRepo: LeaseRepository,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Cron('0 3 * * *', {
    timeZone: 'America/Lima',
  })
  async handleDailyPaymentCheck() {
    this.logger.log(
      'Iniciando verificación automatizada de ciclos de pago mensuales...',
    );

    try {
      const activeLeases = await this.leaseRepo.ormRepository.find({
        where: { status: 'activo' },
        relations: [
          'tenant',
          'unit',
          'unit.floor',
          'unit.floor.property',
          'unit.floor.property.owner',
        ],
      });

      const todayString = new Date().toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        day: 'numeric',
      });
      const todayDayNum = parseInt(todayString, 10);

      this.logger.log(
        `Procesando contratos cuyo aniversario de pago sea el día: ${todayDayNum}. Totales encontrados: ${activeLeases.length}`,
      );

      for (const lease of activeLeases) {
        if (!lease.startDate) continue;

        const owner = lease.unit?.floor?.property?.owner;
        if (!owner) continue;

        const syncStatus = this.whatsappService.getSyncStatus(owner.id);
        if (!syncStatus.status || syncStatus.status !== 'CONNECTED') {
          this.logger.warn(
            `Saltando notificación para contrato ID ${lease.id}: El motor de WhatsApp del dueño ${owner.id} no está conectado.`,
          );
          continue;
        }

        const leaseStartDayNum = new Date(lease.startDate).getUTCDate();

        this.logger.log(
          `Verificando contrato ID ${lease.id}: Día contrato = ${leaseStartDayNum} | Día actual = ${todayDayNum} | Estado pago = ${lease.paymentStatus}`,
        );

        if (
          leaseStartDayNum === todayDayNum &&
          lease.paymentStatus !== 'pendiente'
        ) {
          this.logger.log(
            `¡MATCH REAL ENCONTRADO! Ejecutando cobro automático para: ${lease.tenant.firstName} (Cuarto ${lease.unit?.unitNumber})`,
          );

          lease.paymentStatus = 'pendiente';
          await this.leaseRepo.ormRepository.save(lease);

          const message = WhatsappTemplatesHelper.getPendingPaymentMessage({
            tenantName: lease.tenant.firstName,
            unitNumber: lease.unit?.unitNumber || 'N/A',
            monthlyRent: Number(lease.monthlyRent),
            yapeNumber: owner?.yapeNumber || '',
            bcpAccount: owner?.bcpAccount || '',
            isAutomaticCron: true,
          });

          if (lease.tenant?.phoneNumber) {
            this.logger.log(
              `Enviando notificación automática a: ${lease.tenant.phoneNumber} mediante canal del dueño ${owner.id}`,
            );
            await this.whatsappService.sendMessage(
              owner.id,
              lease.tenant.phoneNumber,
              message,
            );
          }
        }
      }

      this.logger.log('Proceso de verificación diario finalizado.');
    } catch (error) {
      this.logger.error(
        'Error crítico en el proceso de notificación automática del Cron:',
        error,
      );
    }
  }
}
