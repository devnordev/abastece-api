import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateParametrosTetoDto } from './dto/create-parametros-teto.dto';
import { UpdateParametrosTetoDto } from './dto/update-parametros-teto.dto';
import { AnpBase } from '@prisma/client';

@Injectable()
export class ParametrosTetoService {
  constructor(private prisma: PrismaService) {}

  async create(createParametrosTetoDto: CreateParametrosTetoDto) {
    const parametroTeto = await this.prisma.parametrosTeto.create({
      data: {
        anp_base: createParametrosTetoDto.anp_base || AnpBase.MEDIO,
        margem_pct: createParametrosTetoDto.margem_pct,
        excecoes_combustivel: createParametrosTetoDto.excecoes_combustivel,
        ativo: createParametrosTetoDto.ativo !== undefined ? createParametrosTetoDto.ativo : true,
        observacoes: createParametrosTetoDto.observacoes,
      },
    });

    return {
      message: 'Parâmetro de teto criado com sucesso',
      parametroTeto,
    };
  }

  async findAll() {
    const parametrosTeto = await this.prisma.parametrosTeto.findMany({
      orderBy: { id: 'desc' },
    });

    return {
      message: 'Parâmetros de teto encontrados com sucesso',
      parametrosTeto,
      total: parametrosTeto.length,
    };
  }

  async findOne(id: number) {
    const parametroTeto = await this.prisma.parametrosTeto.findUnique({
      where: { id },
    });

    if (!parametroTeto) {
      throw new NotFoundException('Parâmetro de teto não encontrado');
    }

    return {
      message: 'Parâmetro de teto encontrado com sucesso',
      parametroTeto,
    };
  }

  async update(id: number, updateParametrosTetoDto: UpdateParametrosTetoDto) {
    const existingParametroTeto = await this.prisma.parametrosTeto.findUnique({
      where: { id },
    });

    if (!existingParametroTeto) {
      throw new NotFoundException('Parâmetro de teto não encontrado');
    }

    const parametroTeto = await this.prisma.parametrosTeto.update({
      where: { id },
      data: {
        anp_base: updateParametrosTetoDto.anp_base,
        margem_pct: updateParametrosTetoDto.margem_pct,
        excecoes_combustivel: updateParametrosTetoDto.excecoes_combustivel,
        ativo: updateParametrosTetoDto.ativo,
        observacoes: updateParametrosTetoDto.observacoes,
      },
    });

    return {
      message: 'Parâmetro de teto atualizado com sucesso',
      parametroTeto,
    };
  }

  async remove(id: number) {
    const existingParametroTeto = await this.prisma.parametrosTeto.findUnique({
      where: { id },
    });

    if (!existingParametroTeto) {
      throw new NotFoundException('Parâmetro de teto não encontrado');
    }

    await this.prisma.parametrosTeto.delete({
      where: { id },
    });

    return {
      message: 'Parâmetro de teto excluído com sucesso',
    };
  }
}

