import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ContratoService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    empresaId: number;
    empresa_contratante?: string;
    empresa_contratada: string;
    title: string;
    cnpj_empresa: string;
    vigencia_inicio?: Date;
    vigencia_fim?: Date;
    ativo?: boolean;
    anexo_contrato?: string;
    anexo_contrato_assinado?: string;
  }) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: data.empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Verificar se já existe um contrato para esta empresa
    const existingContrato = await this.prisma.contrato.findFirst({
      where: { empresaId: data.empresaId },
    });

    if (existingContrato) {
      throw new ConflictException('Esta empresa já possui um contrato cadastrado. Uma empresa só pode ter um contrato ativo.');
    }

    const contrato = await this.prisma.contrato.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      include: {
        empresa: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Contrato criado com sucesso',
      contrato,
    };
  }

  async findAll(page = 1, limit = 10, empresaId?: number, ativo?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (empresaId) where.empresaId = empresaId;
    if (ativo !== undefined) where.ativo = ativo;

    const [contratos, total] = await Promise.all([
      this.prisma.contrato.findMany({
        where,
        skip,
        take: limit,
        include: {
          empresa: {
            select: { id: true, nome: true, cnpj: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contrato.count({ where }),
    ]);

    return {
      message: 'Contratos encontrados com sucesso',
      contratos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: {
        empresa: {
          select: { id: true, nome: true, cnpj: true },
        },
        combustiveis: {
          include: {
            combustivel: {
              select: { id: true, nome: true, sigla: true },
            },
          },
        },
        _count: {
          select: {
            combustiveis: true,
            aditivos: true,
          },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return {
      message: 'Contrato encontrado com sucesso',
      contrato,
    };
  }

  async update(id: number, data: {
    empresa_contratante?: string;
    empresa_contratada?: string;
    title?: string;
    cnpj_empresa?: string;
    vigencia_inicio?: Date;
    vigencia_fim?: Date;
    ativo?: boolean;
    anexo_contrato?: string;
    anexo_contrato_assinado?: string;
  }) {
    const existingContrato = await this.prisma.contrato.findUnique({
      where: { id },
    });

    if (!existingContrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    const contrato = await this.prisma.contrato.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      } as any,
      include: {
        empresa: {
          select: { id: true, nome: true, cnpj: true },
        },
      },
    });

    return {
      message: 'Contrato atualizado com sucesso',
      contrato,
    };
  }

  async remove(id: number) {
    const existingContrato = await this.prisma.contrato.findUnique({
      where: { id },
    });

    if (!existingContrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    await this.prisma.contrato.delete({
      where: { id },
    });

    return {
      message: 'Contrato excluído com sucesso',
    };
  }
}
