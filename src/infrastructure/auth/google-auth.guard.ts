import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super({
      // Esto obliga a Google a mostrar siempre el selector de cuentas
      prompt: 'select_account',
      // Opcional: force_reconsent si quisieras que siempre acepten permisos
      accessType: 'offline',
    });
  }
}
