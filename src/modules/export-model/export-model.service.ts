import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExportModelDto } from './dto/create-export-model.dto';
import { UpdateExportModelDto } from './dto/update-export-model.dto';
import { FindExportModelDto } from './dto/find-export-model.dto';
import { VisibilidadeModelo, Prisma } from '@prisma/client';

@Injectable()
export class ExportModelService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém o prefeituraId do usuário
   */
  private obterPrefeituraId(user: any): number {
    // Verificar se é usuário da prefeitura
    if (user?.tipo_usuario !== 'ADMIN_PREFEITURA' && user?.tipo_usuario !== 'COLABORADOR_PREFEITURA') {
      throw new ForbiddenException('Apenas usuários da prefeitura podem gerenciar modelos de exportação.');
    }
    
    const prefeituraId = user?.prefeitura?.id ?? user?.prefeituraId;
    if (!prefeituraId) {
      throw new ForbiddenException('Usuário não está vinculado a uma prefeitura.');
    }
    return prefeituraId;
  }

  /**
   * Obtém o userId do usuário
   */
  private obterUserId(user: any): number {
    const userId = user?.id ?? user?.userId;
    if (!userId) {
      throw new ForbiddenException('Usuário não identificado.');
    }
    return userId;
  }

  /**
   * Verifica se o usuário tem permissão para acessar/editar/deletar um modelo
   */
  private async verificarPermissao(userId: number, modelo: any): Promise<void> {
    // Apenas o criador pode editar/deletar
    if (modelo.criadoPorId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar ou deletar este modelo.');
    }
  }

  /**
   * Verifica se o usuário pode visualizar um modelo
   */
  private podeVisualizar(userId: number, modelo: any): boolean {
    // Se é privado, apenas o criador pode ver
    if (modelo.visibility === VisibilidadeModelo.PRIVATE) {
      return modelo.criadoPorId === userId;
    }
    // Se é público, qualquer usuário da mesma prefeitura pode ver
    return true;
  }

  /**
   * Criar modelo de exportação
   */
  async create(user: any, createDto: CreateExportModelDto) {
    const prefeituraId = this.obterPrefeituraId(user);
    const userId = this.obterUserId(user);

    // Validar que o usuário pertence à prefeitura
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario || usuario.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Usuário não pertence à prefeitura especificada.');
    }

    const modelo = await this.prisma.modeloExportacao.create({
      data: {
        prefeituraId,
        criadoPorId: userId,
        titulo: createDto.titulo,
        entityType: createDto.entityType,
        format: createDto.format,
        visibility: createDto.visibility || VisibilidadeModelo.PRIVATE,
        columns: createDto.columns,
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return {
      message: 'Modelo de exportação criado com sucesso',
      modelo,
    };
  }

  /**
   * Listar modelos de exportação
   */
  async findAll(user: any, query: FindExportModelDto) {
    const prefeituraId = this.obterPrefeituraId(user);
    const userId = this.obterUserId(user);

    const page = query.page || 1;
    const limit = query.limit || 100;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Prisma.ModeloExportacaoWhereInput = {
      prefeituraId,
      OR: [
        // Modelos públicos da prefeitura
        { visibility: VisibilidadeModelo.PUBLIC },
        // Modelos privados do usuário
        { visibility: VisibilidadeModelo.PRIVATE, criadoPorId: userId },
      ],
    };

    // Filtros opcionais
    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.format) {
      where.format = query.format;
    }

    const [modelos, total] = await Promise.all([
      this.prisma.modeloExportacao.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.modeloExportacao.count({ where }),
    ]);

    return {
      message: 'Modelos de exportação encontrados',
      modelos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Buscar modelo específico
   */
  async findOne(user: any, id: number) {
    const prefeituraId = this.obterPrefeituraId(user);
    const userId = this.obterUserId(user);

    const modelo = await this.prisma.modeloExportacao.findUnique({
      where: { id },
      include: {
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!modelo) {
      throw new NotFoundException(`Modelo de exportação com ID ${id} não encontrado.`);
    }

    // Verificar se pertence à mesma prefeitura
    if (modelo.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você não tem permissão para acessar este modelo.');
    }

    // Verificar se pode visualizar
    if (!this.podeVisualizar(userId, modelo)) {
      throw new ForbiddenException('Você não tem permissão para visualizar este modelo.');
    }

    return {
      message: 'Modelo de exportação encontrado',
      modelo,
    };
  }

  /**
   * Atualizar modelo
   */
  async update(user: any, id: number, updateDto: UpdateExportModelDto) {
    const prefeituraId = this.obterPrefeituraId(user);
    const userId = this.obterUserId(user);

    // Buscar modelo existente
    const modeloExistente = await this.prisma.modeloExportacao.findUnique({
      where: { id },
    });

    if (!modeloExistente) {
      throw new NotFoundException(`Modelo de exportação com ID ${id} não encontrado.`);
    }

    // Verificar permissão
    if (modeloExistente.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você não tem permissão para acessar este modelo.');
    }

    await this.verificarPermissao(userId, modeloExistente);

    // Atualizar modelo
    const modelo = await this.prisma.modeloExportacao.update({
      where: { id },
      data: {
        ...(updateDto.titulo && { titulo: updateDto.titulo }),
        ...(updateDto.entityType && { entityType: updateDto.entityType }),
        ...(updateDto.format && { format: updateDto.format }),
        ...(updateDto.visibility && { visibility: updateDto.visibility }),
        ...(updateDto.columns && { columns: updateDto.columns }),
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Modelo de exportação atualizado com sucesso',
      modelo,
    };
  }

  /**
   * Deletar modelo
   */
  async remove(user: any, id: number) {
    const prefeituraId = this.obterPrefeituraId(user);
    const userId = this.obterUserId(user);

    // Buscar modelo existente
    const modeloExistente = await this.prisma.modeloExportacao.findUnique({
      where: { id },
    });

    if (!modeloExistente) {
      throw new NotFoundException(`Modelo de exportação com ID ${id} não encontrado.`);
    }

    // Verificar permissão
    if (modeloExistente.prefeituraId !== prefeituraId) {
      throw new ForbiddenException('Você não tem permissão para acessar este modelo.');
    }

    await this.verificarPermissao(userId, modeloExistente);

    // Deletar modelo
    await this.prisma.modeloExportacao.delete({
      where: { id },
    });

    return {
      message: 'Modelo de exportação deletado com sucesso',
    };
  }
}

