import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  firstName!: string;

  @Column({ nullable: true })
  lastName!: string;

  @Column({ nullable: true })
  picture!: string;

  // --- NUEVOS CAMPOS DE PAGO ---
  @Column({ nullable: true })
  yapeNumber!: string;

  @Column({ nullable: true })
  bcpAccount!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Property, (property) => property.owner)
  properties!: Property[];
}
