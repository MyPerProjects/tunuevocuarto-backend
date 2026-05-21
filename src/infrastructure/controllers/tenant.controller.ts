import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from '../../application/services/tenant.service';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo inquilino' })
  async create(@Body() dto: CreateTenantDto, @Req() req: any) {
    return await this.tenantService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los inquilinos registrados' })
  async findAll(@Req() req: any) {
    return await this.tenantService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un inquilino por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.tenantService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos completos de un inquilino' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantDto,
    @Req() req: any,
  ) {
    return await this.tenantService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un inquilino de la base de datos' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.tenantService.delete(id, req.user.userId);
  }
}
