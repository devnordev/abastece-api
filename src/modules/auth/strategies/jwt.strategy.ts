import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const result = await this.authService.validateUser(payload.sub);
    if (!result) {
      throw new UnauthorizedException({
        message: 'Usuário não encontrado ou desativado',
        error: 'Este usuário não foi encontrado ou está desativado. Por favor, entre em contato com o administrador do sistema para reativar sua conta.',
        statusCode: 401,
      });
    }
    if (result === 'INACTIVE') {
      throw new UnauthorizedException({
        message: 'Usuário desativado',
        error: 'Este usuário está desativado e não pode acessar o sistema. Por favor, entre em contato com o administrador do sistema para reativar sua conta.',
        statusCode: 401,
      });
    }
    return result;
  }
}
