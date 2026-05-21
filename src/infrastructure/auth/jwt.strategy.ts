import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'MI_PALABRA_SECRETA_SUPER_SEGURA', // Mantenemos tu clave simétrica del AuthModule
    });
  }

  async validate(payload: any) {
    // Si por alguna razón el token viene corrupto o mal estructurado
    if (!payload || !payload.sub) {
      throw new UnauthorizedException(
        'Token de autenticación inválido o alterado',
      );
    }

    // Retornamos un objeto de usuario unificado para evitar colisiones en req.user
    return {
      userId: payload.sub,
      id: payload.sub,
      email: payload.email,
    };
  }
}
