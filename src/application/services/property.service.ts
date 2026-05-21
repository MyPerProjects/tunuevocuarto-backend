import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PropertyRepository } from '../../infrastructure/persistence/property.repository';
import { CreatePropertyDto } from '../../infrastructure/dtos/create-property.dto';
import {
  UpdatePropertyDto,
  UpdateFloorDto,
  UpdateUnitDto,
} from '../../infrastructure/dtos/update-property.dto';
import { Property } from '../../domain/entities/property.entity';

@Injectable()
export class PropertyService {
  constructor(private readonly propertyRepo: PropertyRepository) {}

  async createProperty(
    dto: CreatePropertyDto,
    userId: number,
  ): Promise<Property> {
    const property = this.propertyRepo.ormRepository.create({
      name: dto.name,
      address: dto.address,
      imageUrl: dto.imageUrl,
      owner: { id: userId },
      floors: dto.floors.map((f) => ({
        level: f.level,
        units: f.units.map((u) => ({
          unitNumber: u.unitNumber,
          price: u.price,
          status: u.status,
          type: u.type,
        })),
      })),
    });

    return await this.propertyRepo.ormRepository.save(property);
  }

  /**
   * CORRECCIÓN: Filtra las propiedades única y exclusivamente del dueño logueado
   */
  async findAll(userId: number): Promise<Property[]> {
    return await this.propertyRepo.ormRepository.find({
      where: { owner: { id: userId } },
      relations: ['floors', 'floors.units'],
      order: { floors: { level: 'ASC' } },
    });
  }

  /**
   * CORRECCIÓN: Busca la propiedad asegurando que coincida con el ID del dueño
   */
  async findOne(id: number, userId: number): Promise<Property> {
    const property = await this.propertyRepo.ormRepository.findOne({
      where: { id, owner: { id: userId } },
      relations: ['floors', 'floors.units'],
    });

    if (!property) {
      throw new NotFoundException(
        'Propiedad no encontrada o no tienes permisos sobre ella',
      );
    }

    return property;
  }

  async updateProperty(
    id: number,
    dto: UpdatePropertyDto,
    userId: number,
  ): Promise<Property> {
    // findOne ya valida la propiedad contra el userId
    const property = await this.findOne(id, userId);

    property.name = dto.name ?? property.name;
    property.address = dto.address ?? property.address;
    property.imageUrl = dto.imageUrl ?? property.imageUrl;

    if (dto.floors) {
      property.floors = dto.floors.map((f: UpdateFloorDto) => ({
        id: f.id,
        level: f.level,
        units: f.units.map((u: UpdateUnitDto) => ({
          id: u.id,
          unitNumber: u.unitNumber,
          price: u.price,
          status: u.status,
          type: u.type,
        })),
      })) as any;
    }

    return await this.propertyRepo.ormRepository.save(property);
  }

  async removeProperty(id: number, userId: number): Promise<void> {
    const property = await this.propertyRepo.ormRepository.findOne({
      where: { id, owner: { id: userId } },
    });
    if (!property)
      throw new NotFoundException('Propiedad no encontrada o no autorizada');

    await this.propertyRepo.ormRepository.remove(property);
  }
}
