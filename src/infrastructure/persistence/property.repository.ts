import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../domain/entities/property.entity';

@Injectable()
export class PropertyRepository {
  constructor(
    @InjectRepository(Property)
    public readonly ormRepository: Repository<Property>,
  ) {}

  async findAll(): Promise<Property[]> {
    return await this.ormRepository.find({
      relations: ['floors', 'floors.units', 'owner'],
    });
  }

  async findOne(id: number): Promise<Property | null> {
    return await this.ormRepository.findOne({
      where: { id },
      relations: ['floors', 'floors.units', 'owner'],
    });
  }
}
