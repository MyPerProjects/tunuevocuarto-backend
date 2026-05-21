import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from '../../application/services/dashboard.service';
import { DashboardSummaryDto } from '../../infrastructure/dtos/dashboard-summary.dto';

@Controller('dashboard')
// Protegemos todas las rutas de este controlador con la estrategia JWT oficial
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: any): Promise<DashboardSummaryDto> {
    // Tras pasar el Guard, Passport inyecta los datos decodificados en req.user
    // Sincronizamos con el payload exacto de tu estrategia: req.user.userId
    const userId = req.user.userId;

    return await this.dashboardService.getSummary(userId);
  }
}
