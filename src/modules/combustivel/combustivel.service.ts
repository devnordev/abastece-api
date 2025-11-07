import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CombustivelAlreadyExistsException,
  CombustivelDuplicateSiglaException,
  CombustivelNotFoundException,
} from '../../common/exceptions/combustivel/combustivel.exceptions';

@Injectable()
export class CombustivelService {
  constructor(private prisma: PrismaService) {}

  async create(data: { nome: string; sigla: string; descricao?: string; observacoes?: string }) {
    const existingCombustivel = await this.prisma.combustivel.findFirst({
      where: { sigla: data.sigla },
    });

    if (existingCombustivel) {
      throw new CombustivelAlreadyExistsException(data.nome, data.sigla, {
        payload: data,
        additionalInfo: {
          prismaWhere: { sigla: data.sigla },
        },
      });
    }

    const combustivel = await this.prisma.combustivel.create({
      data,
    });

    return {
      message: 'Combustível criado com sucesso',
      combustivel,
    };
  }

  async findAll(page = 1, limit = 10, ativo?: boolean) {
    const skip = (page - 1) * limit;
    const where = ativo !== undefined ? { ativo } : {};

    const [combustiveis, total] = await Promise.all([
      this.prisma.combustivel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
      }),
      this.prisma.combustivel.count({ where }),
    ]);

    return {
      message: 'Combustíveis encontrados com sucesso',
      combustiveis,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            veiculos: true,
            abastecimentos: true,
            contratos: true,
          },
        },
      },
    });

    if (!combustivel) {
      throw new CombustivelNotFoundException(id, 'detail', {
        resourceId: id,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    return {
      message: 'Combustível encontrado com sucesso',
      combustivel,
    };
  }

  async update(id: number, data: { nome?: string; sigla?: string; descricao?: string; observacoes?: string; ativo?: boolean }) {
    const existingCombustivel = await this.prisma.combustivel.findUnique({
      where: { id },
    });

    if (!existingCombustivel) {
      throw new CombustivelNotFoundException(id, 'update', {
        resourceId: id,
        payload: data,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    if (data.sigla) {
      const conflictingCombustivel = await this.prisma.combustivel.findFirst({
        where: { sigla: data.sigla, id: { not: id } },
      });

      if (conflictingCombustivel) {
        throw new CombustivelDuplicateSiglaException(data.sigla, {
          resourceId: id,
          payload: data,
          additionalInfo: {
            prismaWhere: {
              sigla: data.sigla,
              idNot: id,
            },
          },
        });
      }
    }

    const combustivel = await this.prisma.combustivel.update({
      where: { id },
      data,
    });

    return {
      message: 'Combustível atualizado com sucesso',
      combustivel,
    };
  }

  async remove(id: number) {
    const existingCombustivel = await this.prisma.combustivel.findUnique({
      where: { id },
    });

    if (!existingCombustivel) {
      throw new CombustivelNotFoundException(id, 'delete', {
        resourceId: id,
        additionalInfo: {
          prismaWhere: { id },
        },
      });
    }

    await this.prisma.combustivel.delete({
      where: { id },
    });

    return {
      message: 'Combustível excluído com sucesso',
    };
  }
}
