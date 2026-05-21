import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from '../../infrastructure/persistence/tenant.repository';
import { Tenant } from '../../domain/entities/tenant.entity';
import { CreateTenantDto } from '../../infrastructure/dtos/create-tenant.dto';
import { UpdateTenantDto } from '../../infrastructure/dtos/update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  /**
   * C - CREATE (Aislado por dueño)
   */
  async create(dto: CreateTenantDto, userId: number): Promise<Tenant> {
    // Construimos el objeto asignando explícitamente el DTO y el owner de forma segura
    const tenantData: Partial<Tenant> = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      dni: dto.dni,
      phoneNumber: dto.phoneNumber,
      owner: { id: userId } as any, // Amarramos el inquilino al ID del JWT de Google
    };

    // Usamos el método nativo de tu repositorio que ya maneja el save e instanciación en limpio
    return await this.tenantRepo.create(tenantData);
  }

  /**
   * R - READ ALL (Filtrado por dueño logueado)
   */
  async findAll(userId: number): Promise<Tenant[]> {
    return await this.tenantRepo.findAll(userId);
  }

  /**
   * R - READ ONE (Asegurando pertenencia)
   */
  async findOne(id: number, userId: number): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOneWithColution(id, userId);

    if (!tenant) {
      throw new NotFoundException(
        `Inquilino con ID ${id} no encontrado o no autorizado`,
      );
    }
    return tenant;
  }

  /**
   * U - UPDATE (Controlado)
   */
  async update(
    id: number,
    dto: UpdateTenantDto,
    userId: number,
  ): Promise<Tenant> {
    // findOne ya garantiza que el inquilino pertenezca al userId logueado
    const tenant = await this.findOne(id, userId);

    // Fusionamos los cambios manteniendo el aislamiento multipropietario intacto
    const updatedTenant = this.tenantRepo.ormRepository.merge(tenant, dto);
    return await this.tenantRepo.ormRepository.save(updatedTenant);
  }

  /**
   * D - DELETE
   */
  async delete(id: number, userId: number): Promise<void> {
    const tenant = await this.findOne(id, userId);
    await this.tenantRepo.ormRepository.remove(tenant);
  }
}
