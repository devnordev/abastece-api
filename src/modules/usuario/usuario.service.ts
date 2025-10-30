import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FindUsuarioDto } from './dto/find-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { TipoUsuario, StatusAcesso } from '@prisma/client';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(createUsuarioDto: CreateUsuarioDto, currentUserId?: number) {
    // Validação de regras de negócio se há usuário atual
    if (currentUserId) {
      await this.validateCreatePermission(currentUserId, createUsuarioDto);
    }
    const { email, senha, cpf } = createUsuarioDto;

    // Verificar se usuário já existe
    const existingEmail = await this.prisma.usuario.findFirst({
      where: { email },
    });

    const existingCpf = await this.prisma.usuario.findFirst({
      where: { cpf },
    });

    if (existingEmail) {
      throw new ConflictException('Este email já está cadastrado no sistema. Por favor, verifique os dados e tente novamente.');
    }

    if (existingCpf) {
      throw new ConflictException('Este CPF já está cadastrado no sistema. Por favor, verifique os dados e tente novamente.');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Determinar o status de acesso padrão
    let defaultStatusAcess = createUsuarioDto.statusAcess || StatusAcesso.Acesso_solicitado;
    
    // Se o usuário atual for ADMIN_PREFEITURA e estiver cadastrando um COLABORADOR_PREFEITURA,
    // o status deve ser "Ativado" automaticamente
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });
      
      if (currentUser && 
          currentUser.tipo_usuario === TipoUsuario.ADMIN_PREFEITURA && 
          createUsuarioDto.tipo_usuario === TipoUsuario.COLABORADOR_PREFEITURA &&
          !createUsuarioDto.statusAcess) {
        defaultStatusAcess = StatusAcesso.Ativado;
      }
    }

    // Criar usuário com valores padrão para campos não obrigatórios
    const usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: hashedPassword,
        data_cadastro: new Date(),
        statusAcess: defaultStatusAcess,
        ativo: createUsuarioDto.ativo !== undefined ? createUsuarioDto.ativo : true,
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

  async findAll(findUsuarioDto: FindUsuarioDto, currentUserId?: number) {
    let {
      nome,
      email,
      cpf,
      tipo_usuario,
      statusAcess,
      ativo,
      prefeituraId,
      empresaId,
      page = 1,
      limit = 10,
    } = findUsuarioDto;

    const skip = (page - 1) * limit;

    // Aplicar filtros de autorização se houver usuário logado
    if (currentUserId) {
      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // ADMIN_PREFEITURA só pode ver usuários da sua prefeitura
        if (currentUser.tipo_usuario === 'ADMIN_PREFEITURA') {
          if (!currentUser.prefeituraId) {
            throw new ForbiddenException('Administrador sem prefeitura vinculada');
          }
          prefeituraId = currentUser.prefeituraId;
        }
      }
    }

    // Construir filtros
    const where: any = {};

    if (nome) {
      where.nome = {
        contains: nome,
        mode: 'insensitive',
      };
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (cpf) {
      where.cpf = {
        contains: cpf,
      };
    }

    if (tipo_usuario) {
      where.tipo_usuario = tipo_usuario;
    }

    if (statusAcess) {
      where.statusAcess = statusAcess;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (prefeituraId) {
      where.prefeituraId = prefeituraId;
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    // Buscar usuários
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: {
          data_cadastro: 'desc',
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    // Remover senhas dos retornos
    const usuariosSemSenha = usuarios.map(({ senha, ...usuario }) => usuario);

    return {
      message: 'Usuários encontrados com sucesso',
      usuarios: usuariosSemSenha,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
      throw new NotFoundException('Usuário não encontrado');
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
      throw new NotFoundException('Usuário não encontrado');
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
        throw new ConflictException('Email ou CPF já está em uso por outro usuário');
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
      throw new NotFoundException('Usuário não encontrado');
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
      throw new BadRequestException('Não é possível excluir usuário com abastecimentos associados');
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
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findByCpf(cpf: string) {
    return this.prisma.usuario.findUnique({
      where: { cpf },
    });
  }

  private async validateCreatePermission(currentUserId: number, createUsuarioDto: CreateUsuarioDto) {
    // Buscar o usuário atual
    const currentUser = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new ForbiddenException('Usuário atual não encontrado');
    }

    // SUPER_ADMIN pode criar qualquer tipo de usuário
    if (currentUser.tipo_usuario === TipoUsuario.SUPER_ADMIN) {
      return;
    }

    const { tipo_usuario: newUserType, prefeituraId: newUserPrefeituraId } = createUsuarioDto;

    // ADMIN_PREFEITURA não pode cadastrar outro ADMIN_PREFEITURA
    if (currentUser.tipo_usuario === TipoUsuario.ADMIN_PREFEITURA) {
      if (newUserType === TipoUsuario.ADMIN_PREFEITURA) {
        throw new ForbiddenException('ADMIN_PREFEITURA não pode cadastrar outro ADMIN_PREFEITURA');
      }

      // Verificar se está tentando cadastrar colaborador da mesma prefeitura
      if (newUserType === TipoUsuario.COLABORADOR_PREFEITURA) {
        if (newUserPrefeituraId && newUserPrefeituraId !== currentUser.prefeituraId) {
          throw new ForbiddenException('Você só pode cadastrar colaboradores da sua própria prefeitura');
        }
      }

      // Verificar se está tentando cadastrar colaborador de empresa
      if (newUserType === TipoUsuario.COLABORADOR_EMPRESA || newUserType === TipoUsuario.ADMIN_EMPRESA) {
        throw new ForbiddenException('ADMIN_PREFEITURA não pode cadastrar usuários de empresa');
      }

      // Verificar se prefeituraId está correto
      if (newUserPrefeituraId && newUserPrefeituraId !== currentUser.prefeituraId) {
        throw new ForbiddenException('Você só pode cadastrar usuários da sua própria prefeitura');
      }
    }

    // COLABORADOR_PREFEITURA não pode cadastrar outro COLABORADOR_PREFEITURA
    if (currentUser.tipo_usuario === TipoUsuario.COLABORADOR_PREFEITURA) {
      if (newUserType === TipoUsuario.COLABORADOR_PREFEITURA) {
        throw new ForbiddenException('COLABORADOR_PREFEITURA não pode cadastrar outro COLABORADOR_PREFEITURA');
      }
      if (newUserType === TipoUsuario.ADMIN_PREFEITURA) {
        throw new ForbiddenException('COLABORADOR_PREFEITURA não pode cadastrar ADMIN_PREFEITURA');
      }
      // Colaborador não pode cadastrar outros usuários
      throw new ForbiddenException('COLABORADOR_PREFEITURA não tem permissão para cadastrar usuários');
    }

    // ADMIN_EMPRESA e COLABORADOR_EMPRESA têm suas próprias regras (se necessário)
    if (currentUser.tipo_usuario === TipoUsuario.ADMIN_EMPRESA) {
      if (newUserType === TipoUsuario.ADMIN_EMPRESA) {
        throw new ForbiddenException('ADMIN_EMPRESA não pode cadastrar outro ADMIN_EMPRESA');
      }
      // Implementar outras regras para ADMIN_EMPRESA se necessário
    }

    if (currentUser.tipo_usuario === TipoUsuario.COLABORADOR_EMPRESA) {
      if (newUserType === TipoUsuario.COLABORADOR_EMPRESA || newUserType === TipoUsuario.ADMIN_EMPRESA) {
        throw new ForbiddenException('COLABORADOR_EMPRESA não tem permissão para cadastrar esse tipo de usuário');
      }
      throw new ForbiddenException('COLABORADOR_EMPRESA não tem permissão para cadastrar usuários');
    }
  }
}
