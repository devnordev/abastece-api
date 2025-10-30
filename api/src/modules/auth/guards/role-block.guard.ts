import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RoleBlockGuard implements CanActivate {
  constructor(private readonly blockedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (this.blockedRoles.includes(user.tipo_usuario)) {
      throw new ForbiddenException(`Usuários com perfil ${user.tipo_usuario} não têm acesso a este recurso`);
    }

    return true;
  }
}

