import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ColaboradorPrefeituraGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.tipo_usuario !== 'COLABORADOR_PREFEITURA') {
      throw new ForbiddenException(
        'Apenas usuários com perfil COLABORADOR_PREFEITURA têm acesso a este recurso',
      );
    }

    return true;
  }
}

