import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class EmpresaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    const allowedRoles = ['ADMIN_EMPRESA', 'COLABORADOR_EMPRESA'];

    if (!allowedRoles.includes(user.tipo_usuario)) {
      throw new ForbiddenException(
        'Apenas usuários com perfil ADMIN_EMPRESA ou COLABORADOR_EMPRESA têm acesso a este recurso'
      );
    }

    return true;
  }
}

