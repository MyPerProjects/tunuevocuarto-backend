import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Property } from './property.entity';
import { Unit } from './unit.entity';

@Entity('floors')
export class Floor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: number; // 1, 2, 3...

  @ManyToOne(() => Property, (property) => property.floors, {
    onDelete: 'CASCADE',
  })
  property: Property;

  @OneToMany(() => Unit, (unit) => unit.floor, { cascade: true })
  units: Unit[];
}
