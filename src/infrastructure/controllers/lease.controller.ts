import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaseService } from '../../application/services/lease.service';
import { CreateLeaseDto } from '../dtos/create-lease.dto';

@ApiTags('leases')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('leases')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @ApiOperation({
    summary: 'Listar todos los contratos con filtros opcionales',
  })
  @Get()
  async findAll(
    @Req() req: any,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    return await this.leaseService.findAllLeases(
      req.user.userId,
      propertyId ? +propertyId : undefined,
      status,
      paymentStatus,
    );
  }

  @ApiOperation({ summary: 'Registrar un nuevo alquiler y ocupar el cuarto' })
  @Post()
  async create(@Body() dto: CreateLeaseDto, @Req() req: any) {
    return await this.leaseService.createLease(dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Actualizar estado de pago y disparar WhatsApp' })
  @Patch(':id/payment-status')
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: string,
    @Req() req: any,
  ) {
    return await this.leaseService.updatePaymentStatus(
      id,
      status,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Terminar un contrato y liberar el cuarto' })
  @Patch(':id/terminate')
  async terminate(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.leaseService.terminateLease(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Eliminar un contrato por error de registro' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return await this.leaseService.deleteLease(id, req.user.userId);
  }
}
