import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class PrefeituraAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowed = ['ADMIN_PREFEITURA', 'COLABORADOR_PREFEITURA'];
    if (!allowed.includes(user.tipo_usuario)) {
      throw new ForbiddenException('Apenas usuários com perfil ADMIN_PREFEITURA ou COLABORADOR_PREFEITURA têm acesso a este recurso');
    }

    return true;
  }
}

