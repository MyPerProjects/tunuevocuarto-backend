import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from '../../domain/entities/property.entity';
import { Floor } from '../../domain/entities/floor.entity';
import { Unit } from '../../domain/entities/unit.entity';
import { Tenant } from '../../domain/entities/tenant.entity';
import { Lease } from '../../domain/entities/lease.entity';

import { PropertyRepository } from './property.repository';
import { TenantRepository } from './tenant.repository';
import { LeaseRepository } from './lease.repository';

import { PropertyService } from '../../application/services/property.service';
import { TenantService } from '../../application/services/tenant.service';
import { LeaseService } from '../../application/services/lease.service';
import { LeaseTaskService } from '../../application/services/lease-task.service';
import { DashboardService } from '../../application/services/dashboard.service';

import { PropertyController } from '../controllers/property.controller';
import { TenantController } from '../controllers/tenant.controller';
import { LeaseController } from '../controllers/lease.controller';
import { DashboardController } from '../controllers/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Property, Floor, Unit, Tenant, Lease])],
  controllers: [
    PropertyController,
    TenantController,
    LeaseController,
    DashboardController,
  ],
  providers: [
    PropertyRepository,
    TenantRepository,
    LeaseRepository,
    PropertyService,
    TenantService,
    LeaseService,
    LeaseTaskService,
    DashboardService,
  ],
  exports: [PropertyService, TenantService, LeaseService],
})
export class PropertyModule {}
