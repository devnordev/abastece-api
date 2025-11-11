import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminPrefeituraEmpresaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.tipo_usuario !== 'ADMIN_PREFEITURA' && user.tipo_usuario !== 'ADMIN_EMPRESA') {
      throw new ForbiddenException('Apenas usuários com perfil ADMIN_PREFEITURA ou ADMIN_EMPRESA têm acesso a este recurso');
    }

    return true;
  }
}

