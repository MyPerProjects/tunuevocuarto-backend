import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Lease } from './lease.entity';
import { User } from './user.entity'; // Importamos tu entidad de usuario

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 8 })
  dni!: string;

  @Column({ length: 15 })
  phoneNumber!: string;

  @OneToMany(() => Lease, (lease) => lease.tenant)
  leases!: Lease[];

  // RELACIÓN MULTIPROPIETARIO: Enlazamos el inquilino al dueño de la cuenta de Google
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  owner!: User;
}
