import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Patch,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../application/services/auth.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { GoogleAuthGuard } from '../auth/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Redirigir a Google' })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() _req: any) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateGoogleUser(req.user);

    // EXTRAEMOS EL TOKEN (Asegúrate que result.accessToken sea el nombre correcto)
    const token = result.access_token;

    // REDIRIGIMOS AL FRONTEND PASANDO EL TOKEN
    return res.redirect(`http://localhost:4200/dashboard?token=${token}`);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar métodos de pago del dueño' })
  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.userId;
    return await this.authService.updatePaymentMethods(userId, dto);
  }
}
