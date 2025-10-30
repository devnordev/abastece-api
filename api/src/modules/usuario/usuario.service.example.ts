import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FindUsuarioDto } from './dto/find-usuario.dto';
import * as bcrypt from 'bcryptjs';

// Importar as exceções personalizadas
import {
  UsuarioNotFoundException,
  UsuarioAlreadyExistsException,
  UsuarioInactiveException,
  UsuarioAccessDeniedException,
  UsuarioInvalidCredentialsException,
  UsuarioPermissionDeniedException,
  UsuarioCannotDeleteWithRelationsException,
  UsuarioInvalidStatusTransitionException,
} from '../../common/exceptions';

@Injectable()
export class UsuarioServiceExample {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    const { email, senha, cpf } = createUsuarioDto;

    // Verificar se usuário já existe
    const existingUser = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email },
          { cpf },
        ],
      },
    });

    if (existingUser) {
      // Usar exceção personalizada com detalhes
      throw new UsuarioAlreadyExistsException(email, cpf);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Criar usuário
    const usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: hashedPassword,
        data_cadastro: new Date(),
      } as any,
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    // Remover senha do retorno
    const { senha: _, ...usuarioSemSenha } = usuario;

    return {
      message: 'Usuário criado com sucesso',
      usuario: usuarioSemSenha,
    };
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    if (!usuario) {
      // Usar exceção personalizada com ID
      throw new UsuarioNotFoundException(id);
    }

    // Remover senha do retorno
    const { senha, ...usuarioSemSenha } = usuario;

    return {
      message: 'Usuário encontrado com sucesso',
      usuario: usuarioSemSenha,
    };
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // Verificar se usuário existe
    const existingUsuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!existingUsuario) {
      throw new UsuarioNotFoundException(id);
    }

    // Se estiver atualizando email ou CPF, verificar se já existe
    if (updateUsuarioDto.email || updateUsuarioDto.cpf) {
      const whereCondition: any = {
        id: { not: id },
      };

      if (updateUsuarioDto.email || updateUsuarioDto.cpf) {
        whereCondition.OR = [];
        if (updateUsuarioDto.email) {
          whereCondition.OR.push({ email: updateUsuarioDto.email });
        }
        if (updateUsuarioDto.cpf) {
          whereCondition.OR.push({ cpf: updateUsuarioDto.cpf });
        }
      }

      const conflictingUser = await this.prisma.usuario.findFirst({
        where: whereCondition,
      });

      if (conflictingUser) {
        throw new UsuarioAlreadyExistsException(
          updateUsuarioDto.email,
          updateUsuarioDto.cpf
        );
      }
    }

    // Validar transição de status
    if (updateUsuarioDto.statusAcess && existingUsuario.statusAcess !== updateUsuarioDto.statusAcess) {
      const validTransitions = {
        'Acesso_solicitado': ['Em_validacao', 'Ativado', 'Desativado'],
        'Em_validacao': ['Acesso_solicitado', 'Ativado', 'Desativado'],
        'Ativado': ['Desativado'],
        'Desativado': ['Ativado'],
      };

      const allowedTransitions = validTransitions[existingUsuario.statusAcess] || [];
      if (!allowedTransitions.includes(updateUsuarioDto.statusAcess)) {
        throw new UsuarioInvalidStatusTransitionException(
          existingUsuario.statusAcess,
          updateUsuarioDto.statusAcess
        );
      }
    }

    // Se estiver atualizando a senha, fazer hash
    if (updateUsuarioDto.senha) {
      updateUsuarioDto.senha = await bcrypt.hash(updateUsuarioDto.senha, 12);
    }

    // Atualizar usuário
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: updateUsuarioDto as any,
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    // Remover senha do retorno
    const { senha, ...usuarioSemSenha } = usuario;

    return {
      message: 'Usuário atualizado com sucesso',
      usuario: usuarioSemSenha,
    };
  }

  async remove(id: number) {
    // Verificar se usuário existe
    const existingUsuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!existingUsuario) {
      throw new UsuarioNotFoundException(id);
    }

    // Verificar se usuário tem relacionamentos que impedem a exclusão
    const hasRelations = await this.prisma.abastecimento.findFirst({
      where: {
        OR: [
          { solicitanteId: id },
          { validadorId: id },
        ],
      },
    });

    if (hasRelations) {
      throw new UsuarioCannotDeleteWithRelationsException(['abastecimentos']);
    }

    // Excluir usuário
    await this.prisma.usuario.delete({
      where: { id },
    });

    return {
      message: 'Usuário excluído com sucesso',
    };
  }

  async findByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UsuarioNotFoundException(undefined, email);
    }

    return usuario;
  }

  async findByCpf(cpf: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { cpf },
    });

    if (!usuario) {
      throw new UsuarioNotFoundException(undefined, cpf);
    }

    return usuario;
  }

  // Exemplo de validação de permissões
  async validateUserPermission(userId: number, action: string, targetUserId?: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UsuarioNotFoundException(userId);
    }

    if (!user.ativo) {
      throw new UsuarioInactiveException(user.email);
    }

    if (user.statusAcess !== 'Ativado') {
      throw new UsuarioAccessDeniedException(user.statusAcess);
    }

    // Verificar se é SUPER_ADMIN (pode tudo)
    if (user.tipo_usuario === 'SUPER_ADMIN') {
      return true;
    }

    // Verificar se é ADMIN_PREFEITURA ou ADMIN_EMPRESA
    if (user.tipo_usuario === 'ADMIN_PREFEITURA' || user.tipo_usuario === 'ADMIN_EMPRESA') {
      // Se está tentando alterar outro usuário, verificar se é do mesmo escopo
      if (targetUserId && targetUserId !== userId) {
        const targetUser = await this.prisma.usuario.findUnique({
          where: { id: targetUserId },
        });

        if (!targetUser) {
          throw new UsuarioNotFoundException(targetUserId);
        }

        // Verificar se é da mesma prefeitura ou empresa
        if (user.tipo_usuario === 'ADMIN_PREFEITURA' && targetUser.prefeituraId !== user.prefeituraId) {
          throw new UsuarioPermissionDeniedException('ADMIN_PREFEITURA');
        }

        if (user.tipo_usuario === 'ADMIN_EMPRESA' && targetUser.empresaId !== user.empresaId) {
          throw new UsuarioPermissionDeniedException('ADMIN_EMPRESA');
        }
      }
      return true;
    }

    // Colaboradores não podem gerenciar outros usuários
    throw new UsuarioPermissionDeniedException('ADMIN');
  }
}
