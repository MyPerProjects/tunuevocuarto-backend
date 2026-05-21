export class KpiSummaryDto {
  totalUnits!: number;
  occupiedUnits!: number;
  availableUnits!: number;
  maintenanceUnits!: number;
  occupancyPercentage!: number;
  collectedRevenueThisMonth!: number;
  pendingRevenueThisMonth!: number;
  activeTenantsCount!: number;
}

export class MonthlyRevenueDto {
  monthName!: string;
  amount!: number;
}

export class CriticalAlertDto {
  leaseId!: number;
  tenantName!: string;
  tenantPhone!: string;
  unitNumber!: string;
  propertyName!: string;
  monthlyRent!: number;
  daysDelayed!: number; // Días transcurridos desde su fecha de pago esperada
}

export class RecentActivityDto {
  type!: 'CHECK_IN' | 'CHECK_OUT';
  tenantName!: string;
  unitNumber!: string;
  propertyName!: string;
  date!: Date;
}

export class DashboardSummaryDto {
  kpis!: KpiSummaryDto;
  monthlyRevenueHistory!: MonthlyRevenueDto[];
  criticalAlerts!: CriticalAlertDto[];
  recentActivity!: RecentActivityDto[];
}
