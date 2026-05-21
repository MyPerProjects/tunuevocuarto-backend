import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Floor } from './floor.entity';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  unitNumber!: string; // Ej: "101", "202"

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 'vacio' })
  status!: string; // vacio, ocupado, mantenimiento

  @Column({ default: 'Cuarto' })
  type!: string; // Cuarto, Mini-Depa, Departamento

  @ManyToOne(() => Floor, (floor) => floor.units, { onDelete: 'CASCADE' })
  floor!: Floor;
}
