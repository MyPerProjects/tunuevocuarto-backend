import { Injectable, Logger } from '@nestjs/common';
import { LeaseRepository } from '../../infrastructure/persistence/lease.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../../domain/entities/unit.entity';
import {
  DashboardSummaryDto,
  KpiSummaryDto,
  CriticalAlertDto,
  RecentActivityDto,
  MonthlyRevenueDto,
} from '../../infrastructure/dtos/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly leaseRepo: LeaseRepository,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>, // Inyectamos Unit para contar las habitaciones reales del dueño
  ) {}

  async getSummary(userId: number): Promise<DashboardSummaryDto> {
    this.logger.log(
      `Generando estadísticas reales del Dashboard para el usuario ${userId}...`,
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Normalizamos la fecha de hoy a la medianoche en la zona horaria del servidor para comparar días puros
    const hoyPuro = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const totalUnitsElements = await this.unitRepo.find({
      where: { floor: { property: { owner: { id: userId } } } },
    });

    const totalUnits = totalUnitsElements.length;

    // Contamos los estados reales directamente desde las columnas de tu base de datos
    const occupiedUnits = totalUnitsElements.filter(
      (u) => u.status === 'ocupado',
    ).length;
    const availableUnits = totalUnitsElements.filter(
      (u) => u.status === 'vacio',
    ).length;
    const maintenanceUnits = totalUnitsElements.filter(
      (u) => u.status === 'mantenimiento',
    ).length;

    const occupancyPercentage =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const leasesActivos = await this.leaseRepo.ormRepository.find({
      where: {
        status: 'activo',
        unit: { floor: { property: { owner: { id: userId } } } },
      },
      relations: ['tenant', 'unit', 'unit.floor', 'unit.floor.property'],
    });

    let collectedRevenueThisMonth = 0;
    let pendingRevenueThisMonth = 0;

    leasesActivos.forEach((lease) => {
      if (lease.paymentStatus === 'al_dia') {
        collectedRevenueThisMonth += Number(lease.monthlyRent);
      } else if (lease.paymentStatus === 'pendiente') {
        pendingRevenueThisMonth += Number(lease.monthlyRent);
      }
    });

    const kpis: KpiSummaryDto = {
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyPercentage: Math.round(occupancyPercentage * 10) / 10,
      collectedRevenueThisMonth,
      pendingRevenueThisMonth,
      activeTenantsCount: occupiedUnits,
    };

    const criticalAlerts: CriticalAlertDto[] = [];

    leasesActivos.forEach((lease) => {
      // Si el contrato está en 'pendiente', entra al panel inmediatamente
      if (lease.paymentStatus === 'pendiente' && lease.startDate) {
        // Creamos la fecha base usando el año y mes actual, pero el día pactado en el startDate (UTC para evitar desfases)
        const fechaContratoOriginal = new Date(lease.startDate);
        const diaPactado = fechaContratoOriginal.getUTCDate();

        // Fecha exacta en la que le correspondía pagar este mes a la medianoche
        const fechaVencimientoPura = new Date(
          now.getFullYear(),
          now.getMonth(),
          diaPactado,
          0,
          0,
          0,
          0,
        );

        let daysDelayed = 0;

        // Si la fecha en la que debía pagar ya pasó o es hoy mismo
        if (fechaVencimientoPura <= hoyPuro) {
          const diffTime = hoyPuro.getTime() - fechaVencimientoPura.getTime();
          // Math.floor sobre la resta de medianoches nos da la cantidad exacta de días enteros transcurridos (0, 1, 2...)
          daysDelayed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        criticalAlerts.push({
          leaseId: lease.id,
          tenantName:
            `${lease.tenant?.firstName || ''} ${lease.tenant?.lastName || ''}`.trim(),
          tenantPhone: lease.tenant?.phoneNumber || '',
          unitNumber: lease.unit?.unitNumber || 'N/A',
          propertyName: lease.unit?.floor?.property?.name || 'Inmueble',
          monthlyRent: Number(lease.monthlyRent),
          daysDelayed, // Si vence hoy, dará 0 exactamente
        });
      }
    });

    criticalAlerts.sort((a, b) => b.daysDelayed - a.daysDelayed);

    // Traemos todos los contratos vinculados al dueño (activos y finalizados) para extraer pagos reales históricos
    const todosLosLeases = await this.leaseRepo.ormRepository.find({
      where: { unit: { floor: { property: { owner: { id: userId } } } } },
      order: { createdAt: 'ASC' }, // Ordenados cronológicamente desde el inicio real del sistema
    });

    const revenueMap = new Map<string, number>();
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Oct',
      'Nov',
      'Dic',
    ];

    todosLosLeases.forEach((lease) => {
      if (lease.createdAt) {
        const leaseDate = new Date(lease.createdAt);
        const mName = `${monthNames[leaseDate.getMonth()]} ${leaseDate.getFullYear().toString().substring(2)}`;

        // Si el contrato está al día o ya se cobró en su momento, sumamos su monto real a ese mes específico
        if (lease.paymentStatus === 'al_dia' || lease.status === 'finalizado') {
          const currentSum = revenueMap.get(mName) || 0;
          revenueMap.set(mName, currentSum + Number(lease.monthlyRent));
        }
      }
    });

    const monthlyRevenueHistory: MonthlyRevenueDto[] = [];
    revenueMap.forEach((amount, monthName) => {
      monthlyRevenueHistory.push({ monthName, amount: Math.round(amount) });
    });

    if (monthlyRevenueHistory.length === 0) {
      const currentMonthName = `${monthNames[currentMonth]} ${currentYear.toString().substring(2)}`;
      monthlyRevenueHistory.push({
        monthName: currentMonthName,
        amount: Math.round(collectedRevenueThisMonth),
      });
    }

    const leasesRecientes = await this.leaseRepo.ormRepository.find({
      where: { unit: { floor: { property: { owner: { id: userId } } } } },
      relations: ['tenant', 'unit', 'unit.floor', 'unit.floor.property'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentActivity: RecentActivityDto[] = leasesRecientes.map((lease) => {
      const isFinalizado = lease.status === 'finalizado';
      return {
        type: isFinalizado ? 'CHECK_OUT' : 'CHECK_IN',
        tenantName:
          `${lease.tenant?.firstName || ''} ${lease.tenant?.lastName || ''}`.trim(),
        unitNumber: lease.unit?.unitNumber || 'N/A',
        propertyName: lease.unit?.floor?.property?.name || 'Inmueble',
        date:
          isFinalizado && lease.terminatedAt
            ? new Date(lease.terminatedAt)
            : new Date(lease.createdAt || lease.startDate),
      };
    });

    return {
      kpis,
      monthlyRevenueHistory,
      criticalAlerts: criticalAlerts.slice(0, 5),
      recentActivity: recentActivity.slice(0, 6),
    };
  }
}
