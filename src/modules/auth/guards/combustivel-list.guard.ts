import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CombustivelListGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN_PREFEITURA',
      'ADMIN_EMPRESA',
      'COLABORADOR_PREFEITURA',
      'COLABORADOR_EMPRESA',
    ];
    
    if (!allowedRoles.includes(user.tipo_usuario)) {
      throw new ForbiddenException('Apenas usuários com perfil SUPER_ADMIN ou ADMIN_EMPRESA têm acesso a este recurso');
    }

    return true;
  }
}

