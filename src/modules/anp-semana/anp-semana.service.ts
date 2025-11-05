import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAnpSemanaDto } from './dto/create-anp-semana.dto';
import { UpdateAnpSemanaDto } from './dto/update-anp-semana.dto';

@Injectable()
export class AnpSemanaService {
  constructor(private prisma: PrismaService) {}

  async create(createAnpSemanaDto: CreateAnpSemanaDto) {
    const anpSemana = await this.prisma.anpSemana.create({
      data: {
        semana_ref: new Date(createAnpSemanaDto.semana_ref),
        publicada_em: createAnpSemanaDto.publicada_em ? new Date(createAnpSemanaDto.publicada_em) : new Date(),
        ativo: createAnpSemanaDto.ativo !== undefined ? createAnpSemanaDto.ativo : false,
        observacoes: createAnpSemanaDto.observacoes,
        importado_em: createAnpSemanaDto.importado_em ? new Date(createAnpSemanaDto.importado_em) : null,
      },
      include: {
        _count: {
          select: {
            precos: true,
          },
        },
      },
    });

    return {
      message: 'Semana ANP criada com sucesso',
      anpSemana,
    };
  }

  async findAll() {
    const anpSemanas = await this.prisma.anpSemana.findMany({
      include: {
        _count: {
          select: {
            precos: true,
          },
        },
      },
      orderBy: { semana_ref: 'desc' },
    });

    return {
      message: 'Semanas ANP encontradas com sucesso',
      anpSemanas,
      total: anpSemanas.length,
    };
  }

  async findOne(id: number) {
    const anpSemana = await this.prisma.anpSemana.findUnique({
      where: { id },
      include: {
        precos: {
          take: 10,
          orderBy: { id: 'asc' },
        },
        _count: {
          select: {
            precos: true,
          },
        },
      },
    });

    if (!anpSemana) {
      throw new NotFoundException('Semana ANP não encontrada');
    }

    return {
      message: 'Semana ANP encontrada com sucesso',
      anpSemana,
    };
  }

  async update(id: number, updateAnpSemanaDto: UpdateAnpSemanaDto) {
    const existingAnpSemana = await this.prisma.anpSemana.findUnique({
      where: { id },
    });

    if (!existingAnpSemana) {
      throw new NotFoundException('Semana ANP não encontrada');
    }

    const updateData: any = {};
    if (updateAnpSemanaDto.semana_ref) {
      updateData.semana_ref = new Date(updateAnpSemanaDto.semana_ref);
    }
    if (updateAnpSemanaDto.publicada_em) {
      updateData.publicada_em = new Date(updateAnpSemanaDto.publicada_em);
    }
    if (updateAnpSemanaDto.ativo !== undefined) {
      updateData.ativo = updateAnpSemanaDto.ativo;
    }
    if (updateAnpSemanaDto.observacoes !== undefined) {
      updateData.observacoes = updateAnpSemanaDto.observacoes;
    }
    if (updateAnpSemanaDto.importado_em !== undefined) {
      updateData.importado_em = updateAnpSemanaDto.importado_em ? new Date(updateAnpSemanaDto.importado_em) : null;
    }

    const anpSemana = await this.prisma.anpSemana.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            precos: true,
          },
        },
      },
    });

    return {
      message: 'Semana ANP atualizada com sucesso',
      anpSemana,
    };
  }

  async remove(id: number) {
    const existingAnpSemana = await this.prisma.anpSemana.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            precos: true,
          },
        },
      },
    });

    if (!existingAnpSemana) {
      throw new NotFoundException('Semana ANP não encontrada');
    }

    if (existingAnpSemana._count.precos > 0) {
      throw new BadRequestException('Não é possível excluir semana ANP com preços vinculados');
    }

    await this.prisma.anpSemana.delete({
      where: { id },
    });

    return {
      message: 'Semana ANP excluída com sucesso',
    };
  }
}

