import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lease } from '../../domain/entities/lease.entity';

@Injectable()
export class LeaseRepository {
  constructor(
    @InjectRepository(Lease)
    public readonly ormRepository: Repository<Lease>,
  ) {}

  async create(data: Partial<Lease>): Promise<Lease> {
    const newLease = this.ormRepository.create(data);
    return await this.ormRepository.save(newLease);
  }

  async findOneWithUnit(id: number): Promise<Lease | null> {
    return await this.ormRepository.findOne({
      where: { id },
      relations: ['unit'],
    });
  }

  async remove(lease: Lease): Promise<void> {
    await this.ormRepository.remove(lease);
  }
}
