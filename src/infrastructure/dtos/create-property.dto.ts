import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUnitDto {
  @IsString() unitNumber!: string;
  @IsNumber() price!: number;
  @IsString() status!: string;
  @IsString() type!: string;
}

export class CreateFloorDto {
  @IsNumber() level!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitDto)
  units!: CreateUnitDto[];
}

export class CreatePropertyDto {
  @IsString() name!: string;
  @IsString() address!: string;
  @IsOptional() @IsString() imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFloorDto)
  floors!: CreateFloorDto[];
}
