import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAnpSemanaDto } from './dto/create-anp-semana.dto';
import { UpdateAnpSemanaDto } from './dto/update-anp-semana.dto';

@Injectable()
export class AnpSemanaService {
  constructor(private prisma: PrismaService) {}

  async create(createAnpSemanaDto: CreateAnpSemanaDto) {
    // Validar data de referência
    const dataRef = new Date(createAnpSemanaDto.semana_ref);
    if (isNaN(dataRef.getTime())) {
      throw new BadRequestException('A data de referência da semana informada é inválida. Use o formato YYYY-MM-DD.');
    }

    // Validar data de publicação se fornecida
    let dataPublicada = new Date();
    if (createAnpSemanaDto.publicada_em) {
      dataPublicada = new Date(createAnpSemanaDto.publicada_em);
      if (isNaN(dataPublicada.getTime())) {
        throw new BadRequestException('A data de publicação informada é inválida. Use o formato YYYY-MM-DD ou ISO 8601.');
      }
    }

    // Validar data de importação se fornecida
    let dataImportado = null;
    if (createAnpSemanaDto.importado_em) {
      dataImportado = new Date(createAnpSemanaDto.importado_em);
      if (isNaN(dataImportado.getTime())) {
        throw new BadRequestException('A data de importação informada é inválida. Use o formato YYYY-MM-DD ou ISO 8601.');
      }
    }

    const anpSemana = await this.prisma.anpSemana.create({
      data: {
        semana_ref: dataRef,
        publicada_em: dataPublicada,
        ativo: createAnpSemanaDto.ativo !== undefined ? createAnpSemanaDto.ativo : false,
        observacoes: createAnpSemanaDto.observacoes,
        importado_em: dataImportado,
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
      throw new NotFoundException('Semana ANP não encontrada. Verifique se o ID informado está correto.');
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
      throw new NotFoundException('Semana ANP não encontrada. Verifique se o ID informado está correto.');
    }

    // Validar datas se fornecidas
    if (updateAnpSemanaDto.semana_ref) {
      const dataRef = new Date(updateAnpSemanaDto.semana_ref);
      if (isNaN(dataRef.getTime())) {
        throw new BadRequestException('A data de referência da semana informada é inválida. Use o formato YYYY-MM-DD.');
      }
    }

    if (updateAnpSemanaDto.publicada_em) {
      const dataPublicada = new Date(updateAnpSemanaDto.publicada_em);
      if (isNaN(dataPublicada.getTime())) {
        throw new BadRequestException('A data de publicação informada é inválida. Use o formato YYYY-MM-DD ou ISO 8601.');
      }
    }

    if (updateAnpSemanaDto.importado_em) {
      const dataImportado = new Date(updateAnpSemanaDto.importado_em);
      if (isNaN(dataImportado.getTime())) {
        throw new BadRequestException('A data de importação informada é inválida. Use o formato YYYY-MM-DD ou ISO 8601.');
      }
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
      throw new NotFoundException('Semana ANP não encontrada. Verifique se o ID informado está correto.');
    }

    if (existingAnpSemana._count.precos > 0) {
      throw new BadRequestException(`Não é possível excluir a semana ANP pois existem ${existingAnpSemana._count.precos} preço(s) vinculado(s) a ela. Remova os preços antes de excluir a semana.`);
    }

    await this.prisma.anpSemana.delete({
      where: { id },
    });

    return {
      message: 'Semana ANP excluída com sucesso',
    };
  }
}

