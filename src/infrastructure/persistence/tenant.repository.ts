import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    public readonly ormRepository: Repository<Tenant>,
  ) {}

  /**
   * Registra un inquilino acoplado al objeto partial que ya inyecta el owner id
   */
  async create(tenant: Partial<Tenant>): Promise<Tenant> {
    const newTenant = this.ormRepository.create(tenant);
    return await this.ormRepository.save(newTenant);
  }

  async findAll(userId: number): Promise<Tenant[]> {
    return await this.ormRepository.find({
      where: { owner: { id: userId } },
      order: { id: 'DESC' }, // Los más recientes primero
    });
  }

  async findOneWithColution(
    id: number,
    userId: number,
  ): Promise<Tenant | null> {
    return await this.ormRepository.findOne({
      where: { id, owner: { id: userId } },
    });
  }

  // Mantenemos este fallback por si tu LeaseService u otro módulo requiere cargar la entidad en crudo
  async findOne(id: number): Promise<Tenant | null> {
    return await this.ormRepository.findOne({ where: { id } });
  }

  async remove(tenant: Tenant): Promise<void> {
    await this.ormRepository.remove(tenant);
  }
}
