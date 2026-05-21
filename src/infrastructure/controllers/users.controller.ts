import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../../application/services/users.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt')) // Usa el portero de Passport basado en tu jwt.strategy
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    // El 'req.user' es inyectado por Passport tras validar tu JWT
    return await this.usersService.findByEmail(req.user.email);
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return await this.usersService.updateProfile(req.user.email, dto);
  }
}
