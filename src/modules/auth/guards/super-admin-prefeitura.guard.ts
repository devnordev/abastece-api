import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SuperAdminPrefeituraGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.tipo_usuario !== 'SUPER_ADMIN' && user.tipo_usuario !== 'ADMIN_PREFEITURA') {
      throw new ForbiddenException(
        'Apenas usuários com perfil SUPER_ADMIN ou ADMIN_PREFEITURA têm acesso a este recurso',
      );
    }

    return true;
  }
}

