import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Matches,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Luis Diego' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName!: string;

  @ApiProperty({ example: 'Camus' })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName!: string;

  @ApiProperty({ example: '76543210' })
  @Matches(/^[0-9]{8}$/, {
    message: 'El DNI debe tener exactamente 8 dígitos numéricos',
  })
  dni!: string;

  @ApiProperty({ example: '+51987654321' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'El número de teléfono no es válido',
  })
  phoneNumber!: string;
}

export class CreateLeaseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  tenantId!: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsPositive()
  unitId!: number;

  @ApiProperty({ example: '2026-05-10' })
  @IsDateString(
    {},
    { message: 'La fecha de inicio debe tener un formato válido (YYYY-MM-DD)' },
  )
  startDate!: Date;

  @ApiProperty({ example: 550.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'El precio de renta debe ser un número mayor a cero' })
  monthlyRent!: number;
}
