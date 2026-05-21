import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Luis Diego', description: 'Nombres del inquilino' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  firstName!: string;

  @ApiProperty({
    example: 'Camus Dominguez',
    description: 'Apellidos del inquilino',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  lastName!: string;

  @ApiProperty({ example: '76543210', description: 'DNI peruano de 8 dígitos' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^\d+$/, { message: 'El DNI debe contener solo números' })
  dni!: string;

  @ApiProperty({
    example: '+51987654321',
    description: 'Número de celular para alertas de WhatsApp',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 15, {
    message: 'El número de teléfono debe tener entre 9 y 15 caracteres',
  })
  phoneNumber!: string;
}
