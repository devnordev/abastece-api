import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProcessoCombustivelDto, UpdateProcessoCombustivelDto } from './dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProcessoCombustivelService {
  constructor(private prisma: PrismaService) {}

  private readonly includeDefault = {
    processo: {
      select: {
        id: true,
        numero_processo: true,
        tipo_contrato: true,
        status: true,
      },
    },
    combustivel: {
      select: {
        id: true,
        nome: true,
        sigla: true,
        descricao: true,
      },
    },
  } as const;

  async create(createDto: CreateProcessoCombustivelDto) {
    const { processoId, combustivelId, quantidade_litros, valor_unitario, saldo_bloqueado_processo, saldo_disponivel_processo } = createDto;

    // Validar se o processo existe
    const processo = await this.prisma.processo.findUnique({
      where: { id: processoId },
    });

    if (!processo) {
      throw new NotFoundException(`Processo com ID ${processoId} não encontrado`);
    }

    // Validar se o combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new NotFoundException(`Combustível com ID ${combustivelId} não encontrado`);
    }

    // Verificar se já existe um registro para este processo e combustível
    const existing = await this.prisma.processoCombustivel.findFirst({
      where: {
        processoId,
        combustivelId,
      },
    });

    if (existing) {
      throw new ConflictException('Já existe um registro de combustível para este processo');
    }

    // Calcular saldo disponível se não foi informado
    const saldoBloqueado = saldo_bloqueado_processo ? new Decimal(saldo_bloqueado_processo) : new Decimal(0);
    const saldoDisponivel = saldo_disponivel_processo 
      ? new Decimal(saldo_disponivel_processo)
      : new Decimal(quantidade_litros).minus(saldoBloqueado);

    // Criar processo combustível
    const processoCombustivel = await this.prisma.processoCombustivel.create({
      data: {
        processoId,
        combustivelId,
        quantidade_litros: new Decimal(quantidade_litros),
        valor_unitario: valor_unitario ? new Decimal(valor_unitario) : null,
        saldo_bloqueado_processo: saldoBloqueado,
        saldo_disponivel_processo: saldoDisponivel,
      },
      include: this.includeDefault,
    });

    return {
      message: 'Processo combustível criado com sucesso',
      processoCombustivel,
    };
  }

  async findAll(page = 1, limit = 10, processoId?: number, combustivelId?: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProcessoCombustivelWhereInput = {};

    if (processoId) {
      where.processoId = processoId;
    }

    if (combustivelId) {
      where.combustivelId = combustivelId;
    }

    const [processoCombustiveis, total] = await Promise.all([
      this.prisma.processoCombustivel.findMany({
        where,
        skip,
        take: limit,
        include: this.includeDefault,
        orderBy: { id: 'desc' },
      }),
      this.prisma.processoCombustivel.count({ where }),
    ]);

    return {
      message: 'Processos combustíveis encontrados com sucesso',
      processoCombustiveis,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lista os combustíveis e dados da tabela processoCombustivel por processoId
   */
  async findByProcessoId(processoId: number) {
    // Validar se o processo existe
    const processo = await this.prisma.processo.findUnique({
      where: { id: processoId },
      select: {
        id: true,
        numero_processo: true,
        tipo_contrato: true,
        status: true,
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo com ID ${processoId} não encontrado`);
    }

    // Buscar todos os combustíveis do processo
    const processoCombustiveis = await this.prisma.processoCombustivel.findMany({
      where: {
        processoId,
      },
      include: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            descricao: true,
            ativo: true,
          },
        },
      },
      orderBy: {
        combustivel: {
          nome: 'asc',
        },
      },
    });

    return {
      message: 'Combustíveis do processo encontrados com sucesso',
      processo: {
        id: processo.id,
        numero_processo: processo.numero_processo,
        tipo_contrato: processo.tipo_contrato,
        status: processo.status,
      },
      combustiveis: processoCombustiveis.map((pc) => ({
        id: pc.id,
        processoId: pc.processoId,
        combustivelId: pc.combustivelId,
        quantidade_litros: Number(pc.quantidade_litros.toString()),
        valor_unitario: pc.valor_unitario ? Number(pc.valor_unitario.toString()) : null,
        saldo_bloqueado_processo: pc.saldo_bloqueado_processo ? Number(pc.saldo_bloqueado_processo.toString()) : null,
        saldo_disponivel_processo: pc.saldo_disponivel_processo ? Number(pc.saldo_disponivel_processo.toString()) : null,
        combustivel: pc.combustivel,
      })),
      total: processoCombustiveis.length,
    };
  }

  async findOne(id: number) {
    const processoCombustivel = await this.prisma.processoCombustivel.findUnique({
      where: { id },
      include: this.includeDefault,
    });

    if (!processoCombustivel) {
      throw new NotFoundException(`Processo combustível com ID ${id} não encontrado`);
    }

    return {
      message: 'Processo combustível encontrado com sucesso',
      processoCombustivel: {
        ...processoCombustivel,
        quantidade_litros: Number(processoCombustivel.quantidade_litros.toString()),
        valor_unitario: processoCombustivel.valor_unitario ? Number(processoCombustivel.valor_unitario.toString()) : null,
        saldo_bloqueado_processo: processoCombustivel.saldo_bloqueado_processo ? Number(processoCombustivel.saldo_bloqueado_processo.toString()) : null,
        saldo_disponivel_processo: processoCombustivel.saldo_disponivel_processo ? Number(processoCombustivel.saldo_disponivel_processo.toString()) : null,
      },
    };
  }

  async update(id: number, updateDto: UpdateProcessoCombustivelDto) {
    // Verificar se o registro existe
    const existing = await this.prisma.processoCombustivel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Processo combustível com ID ${id} não encontrado`);
    }

    // Se estiver alterando processoId ou combustivelId, verificar se não existe duplicata
    if (updateDto.processoId !== undefined || updateDto.combustivelId !== undefined) {
      const processoId = updateDto.processoId ?? existing.processoId;
      const combustivelId = updateDto.combustivelId ?? existing.combustivelId;

      const duplicate = await this.prisma.processoCombustivel.findFirst({
        where: {
          processoId,
          combustivelId,
          id: {
            not: id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException('Já existe um registro de combustível para este processo');
      }
    }

    // Validar processo se processoId foi alterado
    if (updateDto.processoId !== undefined) {
      const processo = await this.prisma.processo.findUnique({
        where: { id: updateDto.processoId },
      });

      if (!processo) {
        throw new NotFoundException(`Processo com ID ${updateDto.processoId} não encontrado`);
      }
    }

    // Validar combustível se combustivelId foi alterado
    if (updateDto.combustivelId !== undefined) {
      const combustivel = await this.prisma.combustivel.findUnique({
        where: { id: updateDto.combustivelId },
      });

      if (!combustivel) {
        throw new NotFoundException(`Combustível com ID ${updateDto.combustivelId} não encontrado`);
      }
    }

    // Preparar dados para atualização
    const data: Prisma.ProcessoCombustivelUpdateInput = {};

    if (updateDto.processoId !== undefined) {
      data.processo = {
        connect: { id: updateDto.processoId },
      };
    }

    if (updateDto.combustivelId !== undefined) {
      data.combustivel = {
        connect: { id: updateDto.combustivelId },
      };
    }

    if (updateDto.quantidade_litros !== undefined) {
      data.quantidade_litros = new Decimal(updateDto.quantidade_litros);
    }

    if (updateDto.valor_unitario !== undefined) {
      data.valor_unitario = updateDto.valor_unitario !== null ? new Decimal(updateDto.valor_unitario) : null;
    }

    if (updateDto.saldo_bloqueado_processo !== undefined) {
      data.saldo_bloqueado_processo = new Decimal(updateDto.saldo_bloqueado_processo);
    }

    if (updateDto.saldo_disponivel_processo !== undefined) {
      data.saldo_disponivel_processo = new Decimal(updateDto.saldo_disponivel_processo);
    }

    // Atualizar registro
    const processoCombustivel = await this.prisma.processoCombustivel.update({
      where: { id },
      data,
      include: this.includeDefault,
    });

    return {
      message: 'Processo combustível atualizado com sucesso',
      processoCombustivel: {
        ...processoCombustivel,
        quantidade_litros: Number(processoCombustivel.quantidade_litros.toString()),
        valor_unitario: processoCombustivel.valor_unitario ? Number(processoCombustivel.valor_unitario.toString()) : null,
        saldo_bloqueado_processo: processoCombustivel.saldo_bloqueado_processo ? Number(processoCombustivel.saldo_bloqueado_processo.toString()) : null,
        saldo_disponivel_processo: processoCombustivel.saldo_disponivel_processo ? Number(processoCombustivel.saldo_disponivel_processo.toString()) : null,
      },
    };
  }

  async remove(id: number) {
    // Verificar se o registro existe
    const existing = await this.prisma.processoCombustivel.findUnique({
      where: { id },
      include: {
        aditivos: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Processo combustível com ID ${id} não encontrado`);
    }

    // Verificar se há aditivos vinculados
    if (existing.aditivos.length > 0) {
      throw new BadRequestException('Não é possível excluir: existem aditivos vinculados a este processo combustível');
    }

    // Excluir registro
    await this.prisma.processoCombustivel.delete({
      where: { id },
    });

    return {
      message: 'Processo combustível excluído com sucesso',
    };
  }
}

