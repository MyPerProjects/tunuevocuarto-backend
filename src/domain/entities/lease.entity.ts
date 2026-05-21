import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Unit } from './unit.entity';

@Entity('leases')
export class Lease {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  terminatedAt!: Date;

  @Column({ default: 'activo' })
  status!: string; // 'activo', 'finalizado'

  @Column({ default: 'al_dia' })
  paymentStatus!: string; // 'al_dia', 'pendiente'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyRent!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.leases)
  tenant!: Tenant;

  @ManyToOne(() => Unit)
  unit!: Unit;
}
