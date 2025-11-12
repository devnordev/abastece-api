import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FindUsuarioDto } from './dto/find-usuario.dto';
import { UploadService } from '../upload/upload.service';
import * as bcrypt from 'bcryptjs';
import { TipoUsuario, StatusAcesso } from '@prisma/client';

@Injectable()
export class UsuarioService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto, currentUserId?: number, file?: Express.Multer.File) {
    // Validação de regras de negócio se há usuário atual
    if (currentUserId) {
      await this.validateCreatePermission(currentUserId, createUsuarioDto);
    }
    const { email, senha, cpf, imagem_perfil, orgaoIds, ...restDto } = createUsuarioDto;

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

    // Validar e processar órgãos se fornecido
    if (orgaoIds && orgaoIds.length > 0) {
      // Apenas COLABORADOR_PREFEITURA pode ter múltiplos órgãos
      if (createUsuarioDto.tipo_usuario !== TipoUsuario.COLABORADOR_PREFEITURA) {
        throw new BadRequestException('Apenas usuários do tipo COLABORADOR_PREFEITURA podem ser vinculados a órgãos');
      }

      // Validar que prefeituraId foi informado
      if (!createUsuarioDto.prefeituraId) {
        throw new BadRequestException('Para vincular órgãos, o usuário deve ter uma prefeitura associada');
      }

      // Validar que todos os órgãos existem e pertencem à mesma prefeitura
      await this.validateOrgaos(orgaoIds, createUsuarioDto.prefeituraId);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 12);

    // Fazer upload da imagem se arquivo foi enviado
    let imagemUrl = imagem_perfil;
    if (file) {
      try {
        const usuarioIdTmp = Date.now(); // ID temporário para nome do arquivo
        imagemUrl = await this.uploadService.uploadImage(file, 'usuarios', `usuario-${usuarioIdTmp}`);
      } catch (error) {
        // Se falhar o upload, continua sem imagem (ou lança erro se preferir)
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
      }
    }

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
        ...restDto,
        email,
        senha: hashedPassword,
        cpf,
        imagem_perfil: imagemUrl,
        data_cadastro: new Date(),
        statusAcess: defaultStatusAcess,
        ativo: createUsuarioDto.ativo !== undefined ? createUsuarioDto.ativo : true,
        // Vincular órgãos se fornecido
        orgaos: orgaoIds && orgaoIds.length > 0
          ? {
              create: orgaoIds.map((orgaoId) => ({
                orgaoId,
                ativo: true,
              })),
            }
          : undefined,
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
        orgaos: {
          include: {
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                ativo: true,
              },
            },
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
          orgaos: {
            where: {
              ativo: true,
            },
            include: {
              orgao: {
                select: {
                  id: true,
                  nome: true,
                  sigla: true,
                  ativo: true,
                },
              },
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
        orgaos: {
          where: {
            ativo: true,
          },
          include: {
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                ativo: true,
              },
            },
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

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto, file?: Express.Multer.File) {
    // Verificar se usuário existe
    const existingUsuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: {
            id: true,
          },
        },
      },
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

    // Extrair orgaoIds do DTO
    const { orgaoIds, ...restUpdateDto } = updateUsuarioDto;

    // Validar e processar órgãos se fornecido
    // IMPORTANTE: orgaoIds pode ser undefined (não alterar), [] (remover todos) ou [1,2,3] (atualizar)
    if (orgaoIds !== undefined) {
      if (orgaoIds.length === 0) {
        // Array vazio - apenas validar se é COLABORADOR_PREFEITURA
        // A validação e remoção serão feitas após atualizar o usuário
        if (existingUsuario.tipo_usuario !== TipoUsuario.COLABORADOR_PREFEITURA) {
          throw new BadRequestException('Apenas usuários do tipo COLABORADOR_PREFEITURA podem ter órgãos vinculados');
        }
      } else {
        // Array com IDs - validar
        // Apenas COLABORADOR_PREFEITURA pode ter múltiplos órgãos
        if (existingUsuario.tipo_usuario !== TipoUsuario.COLABORADOR_PREFEITURA) {
          throw new BadRequestException('Apenas usuários do tipo COLABORADOR_PREFEITURA podem ser vinculados a órgãos');
        }

        // Validar que prefeituraId existe (pode estar sendo atualizado ou já existir)
        const prefeituraIdParaValidar = updateUsuarioDto.prefeituraId || existingUsuario.prefeituraId;
        if (!prefeituraIdParaValidar) {
          throw new BadRequestException('Para vincular órgãos, o usuário deve ter uma prefeitura associada');
        }

        // Validar que todos os órgãos existem e pertencem à mesma prefeitura
        await this.validateOrgaos(orgaoIds, prefeituraIdParaValidar);
      }
    }

    // Se arquivo foi enviado, fazer upload
    let imagemUrl = updateUsuarioDto.imagem_perfil;
    if (file) {
      try {
        // Remover imagem antiga se existir
        if (existingUsuario.imagem_perfil) {
          try {
            const oldFilePath = this.uploadService.extractFilePathFromUrl(existingUsuario.imagem_perfil);
            if (oldFilePath) {
              await this.uploadService.deleteImage(oldFilePath);
            }
          } catch (error) {
            console.warn('Erro ao remover imagem antiga:', error.message);
          }
        }

        // Fazer upload da nova imagem
        imagemUrl = await this.uploadService.uploadImage(file, 'usuarios', `usuario-${id}`);
      } catch (error) {
        console.warn('Erro ao fazer upload da imagem:', error.message);
        // Se falhar, mantém a URL anterior ou lança erro
        if (!existingUsuario.imagem_perfil) {
          throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
        }
      }
    }

    // Se estiver atualizando a senha, fazer hash
    if (restUpdateDto.senha) {
      restUpdateDto.senha = await bcrypt.hash(restUpdateDto.senha, 12);
    }

    // Preparar dados para atualização
    const { imagem_perfil, ...restUpdateData } = restUpdateDto;
    const updateData: any = {
      ...restUpdateData,
    };

    // Só atualiza imagem_perfil se tiver nova URL ou se foi explicitamente enviado como null
    if (imagemUrl !== undefined) {
      updateData.imagem_perfil = imagemUrl;
    }

    // Atualizar relacionamentos de órgãos se fornecido
    // IMPORTANTE: orgaoIds pode ser undefined (não alterar), [] (remover todos) ou [1,2,3] (atualizar)
    if (orgaoIds !== undefined) {
      if (orgaoIds.length === 0) {
        // Array vazio - remover todos os relacionamentos de órgãos
        if (existingUsuario.tipo_usuario === TipoUsuario.COLABORADOR_PREFEITURA) {
          await this.prisma.usuarioOrgao.deleteMany({
            where: { usuarioId: id },
          });
        }
      } else {
        // Array com IDs - atualizar relacionamentos
        // Remover relacionamentos antigos que não estão na nova lista
        await this.prisma.usuarioOrgao.deleteMany({
          where: {
            usuarioId: id,
            orgaoId: {
              notIn: orgaoIds,
            },
          },
        });

        // Buscar relacionamentos existentes
        const existingOrgaos = await this.prisma.usuarioOrgao.findMany({
          where: {
            usuarioId: id,
            orgaoId: {
              in: orgaoIds,
            },
          },
          select: {
            orgaoId: true,
          },
        });

        const existingOrgaoIds = existingOrgaos.map((uo) => uo.orgaoId);
        const newOrgaoIds = orgaoIds.filter((orgaoId) => !existingOrgaoIds.includes(orgaoId));

        // Adicionar novos relacionamentos que não existem
        if (newOrgaoIds.length > 0) {
          await this.prisma.usuarioOrgao.createMany({
            data: newOrgaoIds.map((orgaoId) => ({
              usuarioId: id,
              orgaoId,
              ativo: true,
            })),
          });
        }

        // Reativar relacionamentos que estavam inativos
        await this.prisma.usuarioOrgao.updateMany({
          where: {
            usuarioId: id,
            orgaoId: {
              in: orgaoIds,
            },
            ativo: false,
          },
          data: {
            ativo: true,
          },
        });
      }
    }

    // Atualizar usuário
    await this.prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    // Buscar usuário atualizado com órgãos atualizados
    const usuarioAtualizado = await this.prisma.usuario.findUnique({
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
        orgaos: {
          where: {
            ativo: true,
          },
          include: {
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                ativo: true,
              },
            },
          },
        },
      },
    });

    if (!usuarioAtualizado) {
      throw new NotFoundException('Usuário não encontrado após atualização');
    }

    // Remover senha do retorno
    const { senha: _, ...usuarioSemSenha } = usuarioAtualizado;

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

  /**
   * Valida que os órgãos existem e pertencem à mesma prefeitura
   */
  private async validateOrgaos(orgaoIds: number[], prefeituraId: number): Promise<void> {
    if (!orgaoIds || orgaoIds.length === 0) {
      return;
    }

    // Buscar todos os órgãos informados
    const orgaos = await this.prisma.orgao.findMany({
      where: {
        id: {
          in: orgaoIds,
        },
      },
      select: {
        id: true,
        nome: true,
        prefeituraId: true,
        ativo: true,
      },
    });

    // Verificar se todos os órgãos foram encontrados
    if (orgaos.length !== orgaoIds.length) {
      const encontradosIds = orgaos.map((o) => o.id);
      const naoEncontrados = orgaoIds.filter((id) => !encontradosIds.includes(id));
      throw new NotFoundException(`Órgãos não encontrados: ${naoEncontrados.join(', ')}`);
    }

    // Verificar se todos os órgãos pertencem à mesma prefeitura
    const orgaosDeOutraPrefeitura = orgaos.filter((o) => o.prefeituraId !== prefeituraId);
    if (orgaosDeOutraPrefeitura.length > 0) {
      const nomesOrgaos = orgaosDeOutraPrefeitura.map((o) => o.nome).join(', ');
      throw new BadRequestException(
        `Os seguintes órgãos não pertencem à prefeitura informada: ${nomesOrgaos}. Todos os órgãos devem pertencer à mesma prefeitura do usuário.`
      );
    }

    // Verificar se todos os órgãos estão ativos
    const orgaosInativos = orgaos.filter((o) => !o.ativo);
    if (orgaosInativos.length > 0) {
      const nomesOrgaos = orgaosInativos.map((o) => o.nome).join(', ');
      throw new BadRequestException(`Os seguintes órgãos estão inativos: ${nomesOrgaos}`);
    }
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
