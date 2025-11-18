import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TipoCategoria } from '@prisma/client';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  async create(data: { prefeituraId: number; tipo_categoria: TipoCategoria; nome: string; descricao?: string; ativo?: boolean }) {
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: data.prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    const categoria = await this.prisma.categoria.create({
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Categoria criada com sucesso',
      categoria,
    };
  }

  async findAll(page = 1, limit = 10, prefeituraId?: number, tipo_categoria?: TipoCategoria, ativo?: boolean) {
    // Garantir que page e limit sejam números válidos
    const pageNumber = Math.max(1, Math.floor(page) || 1);
    const limitNumber = Math.max(1, Math.floor(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    const where: any = {};
    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (tipo_categoria) where.tipo_categoria = tipo_categoria;
    if (ativo !== undefined) where.ativo = ativo;

    const [categorias, total] = await Promise.all([
      this.prisma.categoria.findMany({
        where,
        skip: skip >= 0 ? skip : 0,
        take: limitNumber,
        include: {
          prefeitura: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.categoria.count({ where }),
    ]);

    return {
      message: 'Categorias encontradas com sucesso',
      categorias,
      pagination: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) },
    };
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
        _count: {
          select: {
            veiculos: true,
          },
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return {
      message: 'Categoria encontrada com sucesso',
      categoria,
    };
  }

  async update(id: number, data: { nome?: string; descricao?: string; ativo?: boolean }) {
    const existingCategoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!existingCategoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    const categoria = await this.prisma.categoria.update({
      where: { id },
      data,
      include: {
        prefeitura: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Categoria atualizada com sucesso',
      categoria,
    };
  }

  async remove(id: number) {
    const existingCategoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!existingCategoria) {
      throw new NotFoundException('Categoria não encontrada');
    }

    await this.prisma.categoria.delete({
      where: { id },
    });

    return {
      message: 'Categoria excluída com sucesso',
    };
  }
}
