import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUnitDto {
  @IsOptional() @IsNumber() id?: number; // <--- CLAVE: Permitir el ID de la base de datos
  @IsString() unitNumber!: string;
  @IsNumber() price!: number;
  @IsString() status!: string;
  @IsString() type!: string;
}

export class UpdateFloorDto {
  @IsOptional() @IsNumber() id?: number;
  @IsNumber() level!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUnitDto)
  units: UpdateUnitDto[] = [];
}

export class UpdatePropertyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFloorDto)
  floors: UpdateFloorDto[] = [];
}
