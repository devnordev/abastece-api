import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminEmpresaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.tipo_usuario !== 'ADMIN_EMPRESA') {
      throw new ForbiddenException('Apenas usuários com perfil ADMIN_EMPRESA têm acesso a este recurso');
    }

    return true;
  }
}

