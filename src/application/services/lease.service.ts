import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaseRepository } from '../../infrastructure/persistence/lease.repository';
import { TenantRepository } from '../../infrastructure/persistence/tenant.repository';
import { Lease } from '../../domain/entities/lease.entity';
import { Unit } from '../../domain/entities/unit.entity';
import { CreateLeaseDto } from '../../infrastructure/dtos/create-lease.dto';
import { WhatsappService } from './whatsapp.service';
import { WhatsappTemplatesHelper } from '../helpers/whatsapp-template.helper';

@Injectable()
export class LeaseService {
  constructor(
    private readonly leaseRepo: LeaseRepository,
    private readonly tenantRepo: TenantRepository,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    private readonly whatsappService: WhatsappService,
  ) {}

  async createLease(dto: CreateLeaseDto, userId: number): Promise<Lease> {
    const unit = await this.unitRepo.findOne({
      where: { id: dto.unitId, floor: { property: { owner: { id: userId } } } },
    });

    if (!unit || unit.status !== 'vacio')
      throw new BadRequestException(
        'Unidad no disponible, en mantenimiento o no te pertenece',
      );

    const tenant = await this.tenantRepo.ormRepository.findOne({
      where: { id: dto.tenantId, owner: { id: userId } },
    } as any);

    if (!tenant)
      throw new NotFoundException('Inquilino no encontrado en tus registros');

    const lease = this.leaseRepo.ormRepository.create({
      startDate: dto.startDate,
      monthlyRent: dto.monthlyRent,
      tenant,
      unit,
      status: 'activo',
      paymentStatus: 'al_dia',
    });

    unit.status = 'ocupado';
    await this.unitRepo.save(unit);
    return await this.leaseRepo.ormRepository.save(lease);
  }

  async findAllLeases(
    userId: number,
    propertyId?: number,
    status?: string,
    paymentStatus?: string,
  ): Promise<Lease[]> {
    const queryBuilder = this.leaseRepo.ormRepository
      .createQueryBuilder('lease')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .leftJoinAndSelect('lease.unit', 'unit')
      .leftJoinAndSelect('unit.floor', 'floor')
      .leftJoinAndSelect('floor.property', 'property')
      .leftJoinAndSelect('property.owner', 'owner')
      .where('owner.id = :userId', { userId });

    if (propertyId) {
      queryBuilder.andWhere('property.id = :propertyId', { propertyId });
    }

    if (status) {
      queryBuilder.andWhere('lease.status = :status', { status });
    }

    if (paymentStatus) {
      queryBuilder.andWhere('lease.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    queryBuilder.orderBy('lease.createdAt', 'DESC');
    return await queryBuilder.getMany();
  }

  async updatePaymentStatus(
    leaseId: number,
    status: string,
    userId: number,
  ): Promise<Lease> {
    const lease = await this.leaseRepo.ormRepository.findOne({
      where: {
        id: leaseId,
        unit: { floor: { property: { owner: { id: userId } } } },
      },
      relations: [
        'tenant',
        'unit',
        'unit.floor',
        'unit.floor.property',
        'unit.floor.property.owner',
      ],
    });

    if (!lease)
      throw new NotFoundException('Contrato no encontrado o no autorizado');
    if (lease.status === 'finalizado')
      throw new BadRequestException('Contrato ya se encuentra finalizado');

    const previousStatus = lease.paymentStatus;
    lease.paymentStatus = status;
    const updatedLease = await this.leaseRepo.ormRepository.save(lease);

    const ownerId = lease.unit.floor.property.owner.id;
    const owner = lease.unit.floor.property.owner;

    if (previousStatus !== 'pendiente' && status === 'pendiente') {
      const msg = WhatsappTemplatesHelper.getPendingPaymentMessage({
        tenantName: lease.tenant.firstName,
        unitNumber: lease.unit.unitNumber,
        monthlyRent: Number(lease.monthlyRent),
        yapeNumber: owner?.yapeNumber || '',
        bcpAccount: owner?.bcpAccount || '',
        isAutomaticCron: false,
      });

      await this.whatsappService.sendMessage(
        ownerId,
        lease.tenant.phoneNumber,
        msg,
      );
    }

    if (previousStatus === 'pendiente' && status === 'al_dia') {
      const nextDateStr = this.calculateNextPaymentDate(lease.startDate);

      const msg = WhatsappTemplatesHelper.getPaymentSuccessMessage({
        tenantName: lease.tenant.firstName,
        unitNumber: lease.unit.unitNumber,
        nextPaymentDate: nextDateStr,
      });

      await this.whatsappService.sendMessage(
        ownerId,
        lease.tenant.phoneNumber,
        msg,
      );
    }

    return updatedLease;
  }

  private calculateNextPaymentDate(startDateInput: Date | string): string {
    const now = new Date();
    const startDate = new Date(startDateInput);
    const diaPactado = startDate.getUTCDate();

    let proximoMes = now.getMonth() + 1;
    let anioCorrespondiente = now.getFullYear();

    if (proximoMes > 11) {
      proximoMes = 0;
      anioCorrespondiente++;
    }

    const ultimoDiaDelProximoMes = new Date(
      anioCorrespondiente,
      proximoMes + 1,
      0,
    ).getDate();
    const diaFinalCalculado =
      diaPactado > ultimoDiaDelProximoMes ? ultimoDiaDelProximoMes : diaPactado;

    const proximaFechaPago = new Date(
      anioCorrespondiente,
      proximoMes,
      diaFinalCalculado,
    );

    return proximaFechaPago.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async terminateLease(leaseId: number, userId: number): Promise<Lease> {
    const lease = await this.leaseRepo.ormRepository.findOne({
      where: {
        id: leaseId,
        unit: { floor: { property: { owner: { id: userId } } } },
      },
      relations: ['unit'],
    });
    if (!lease || lease.status === 'finalizado')
      throw new BadRequestException('Contrato no válido o ya cerrado');

    lease.status = 'finalizado';
    lease.terminatedAt = new Date();
    if (lease.unit) {
      lease.unit.status = 'vacio';
      await this.unitRepo.save(lease.unit);
    }
    return await this.leaseRepo.ormRepository.save(lease);
  }

  async deleteLease(leaseId: number, userId: number): Promise<void> {
    const lease = await this.leaseRepo.ormRepository.findOne({
      where: {
        id: leaseId,
        unit: { floor: { property: { owner: { id: userId } } } },
      },
      relations: ['unit'],
    });
    if (!lease)
      throw new NotFoundException('Contrato no encontrado o no autorizado');

    if (lease.status === 'activo' && lease.unit) {
      lease.unit.status = 'vacio';
      await this.unitRepo.save(lease.unit);
    }

    await this.leaseRepo.remove(lease);
  }
}
