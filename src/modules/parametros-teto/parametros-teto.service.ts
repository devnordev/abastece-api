import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateParametrosTetoDto } from './dto/create-parametros-teto.dto';
import { UpdateParametrosTetoDto } from './dto/update-parametros-teto.dto';
import { AnpBase } from '@prisma/client';
import { AnpPrecosUfService } from '../anp-precos-uf/anp-precos-uf.service';

@Injectable()
export class ParametrosTetoService {
  constructor(
    private prisma: PrismaService,
    private anpPrecosUfService: AnpPrecosUfService,
  ) {}

  async create(createParametrosTetoDto: CreateParametrosTetoDto) {
    // Validar que não existe outro registro de ParametrosTeto
    const existingParametro = await this.prisma.parametrosTeto.findFirst();
    if (existingParametro) {
      throw new ConflictException('Já existe um registro de parâmetros de teto cadastrado. O sistema permite apenas um registro único. Use a atualização para modificar os parâmetros existentes.');
    }

    // Validar margem_pct entre 0 e 100
    const margemPct = createParametrosTetoDto.margem_pct;
    if (margemPct !== null && margemPct !== undefined) {
      if (margemPct < 0 || margemPct > 100) {
        throw new BadRequestException('A margem percentual deve ser um valor entre 0 e 100.');
      }
    }

    const anpBase = createParametrosTetoDto.anp_base || AnpBase.MEDIO;
    const ativo = createParametrosTetoDto.ativo !== undefined ? createParametrosTetoDto.ativo : true;

    const parametroTeto = await this.prisma.parametrosTeto.create({
      data: {
        anp_base: anpBase,
        margem_pct: margemPct,
        excecoes_combustivel: createParametrosTetoDto.excecoes_combustivel,
        ativo: ativo,
        observacoes: createParametrosTetoDto.observacoes,
      },
    });

    // Se o parâmetro estiver ativo, calcular o teto para todos os preços
    if (ativo && margemPct !== null && margemPct !== undefined) {
      await this.anpPrecosUfService.calcularTetoPrecos(anpBase, Number(margemPct));
    }

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
      throw new NotFoundException('Parâmetro de teto não encontrado. Verifique se o ID informado está correto.');
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
      throw new NotFoundException('Parâmetro de teto não encontrado. Verifique se o ID informado está correto.');
    }

    // Validar margem_pct entre 0 e 100 se estiver sendo atualizado
    if (updateParametrosTetoDto.margem_pct !== undefined && updateParametrosTetoDto.margem_pct !== null) {
      if (updateParametrosTetoDto.margem_pct < 0 || updateParametrosTetoDto.margem_pct > 100) {
        throw new BadRequestException('A margem percentual deve ser um valor entre 0 e 100.');
      }
    }

    // Determinar os valores finais após a atualização
    const anpBase = updateParametrosTetoDto.anp_base !== undefined 
      ? updateParametrosTetoDto.anp_base 
      : existingParametroTeto.anp_base;
    const margemPct = updateParametrosTetoDto.margem_pct !== undefined 
      ? updateParametrosTetoDto.margem_pct 
      : existingParametroTeto.margem_pct;
    const ativo = updateParametrosTetoDto.ativo !== undefined 
      ? updateParametrosTetoDto.ativo 
      : existingParametroTeto.ativo;

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

    // Recalcular tetos se:
    // 1. O parâmetro estiver ativo após a atualização
    // 2. E a margem_pct ou anp_base foram alterados ou o parâmetro foi ativado
    const precisaRecalcular = ativo && 
      margemPct !== null && 
      margemPct !== undefined &&
      (
        updateParametrosTetoDto.anp_base !== undefined ||
        updateParametrosTetoDto.margem_pct !== undefined ||
        (updateParametrosTetoDto.ativo !== undefined && updateParametrosTetoDto.ativo === true && !existingParametroTeto.ativo)
      );

    if (precisaRecalcular && margemPct !== null) {
      await this.anpPrecosUfService.calcularTetoPrecos(anpBase, Number(margemPct));
    }

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
      throw new NotFoundException('Parâmetro de teto não encontrado. Verifique se o ID informado está correto.');
    }

    await this.prisma.parametrosTeto.delete({
      where: { id },
    });

    return {
      message: 'Parâmetro de teto excluído com sucesso',
    };
  }
}

