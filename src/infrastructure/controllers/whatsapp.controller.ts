import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WhatsappService } from '../../application/services/whatsapp.service';

@Controller('whatsapp')
@UseGuards(AuthGuard('jwt')) // Blindamos el endpoint contra accesos no autorizados
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    const userId = req.user.userId;
    return this.whatsappService.getSyncStatus(userId);
  }

  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    await this.whatsappService.logoutSession(userId);
    return { message: 'Sesión de WhatsApp destruida exitosamente' };
  }
}
