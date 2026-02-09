import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateConfiguracaoAlertaDto } from './dto/create-configuracao-alerta.dto';
import { UpdateConfiguracaoAlertaDto } from './dto/update-configuracao-alerta.dto';

@Injectable()
export class ConfiguracaoAlertaService {
  constructor(private prisma: PrismaService) {}

  async create(createConfiguracaoAlertaDto: CreateConfiguracaoAlertaDto) {
    // Verificar se prefeitura existe
    const prefeitura = await this.prisma.prefeitura.findUnique({
      where: { id: createConfiguracaoAlertaDto.prefeituraId },
    });

    if (!prefeitura) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se regra existe
    const regra = await this.prisma.regraAlerta.findUnique({
      where: { id: createConfiguracaoAlertaDto.regraAlertaId },
    });

    if (!regra) {
      throw new NotFoundException('Regra de alerta não encontrada');
    }

    // Verificar se já existe configuração para esta prefeitura e regra
    const existing = await this.prisma.configuracaoAlerta.findUnique({
      where: {
        prefeituraId_regraAlertaId: {
          prefeituraId: createConfiguracaoAlertaDto.prefeituraId,
          regraAlertaId: createConfiguracaoAlertaDto.regraAlertaId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma configuração para esta prefeitura e regra');
    }

    const configuracao = await this.prisma.configuracaoAlerta.create({
      data: {
        prefeituraId: createConfiguracaoAlertaDto.prefeituraId,
        regraAlertaId: createConfiguracaoAlertaDto.regraAlertaId,
        valorLimite: createConfiguracaoAlertaDto.valorLimite,
        percentualLimite: createConfiguracaoAlertaDto.percentualLimite,
        periodoDias: createConfiguracaoAlertaDto.periodoDias ?? 7,
        ativo: createConfiguracaoAlertaDto.ativo ?? true,
        observacoes: createConfiguracaoAlertaDto.observacoes,
      },
      include: {
        prefeitura: {
          select: { id: true, nome: true },
        },
        regraAlerta: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });

    return {
      message: 'Configuração de alerta criada com sucesso',
      configuracao,
    };
  }

  async findAll(prefeituraId?: number, ativo?: boolean) {
    const where: any = {};
    if (prefeituraId) where.prefeituraId = prefeituraId;
    if (ativo !== undefined) where.ativo = ativo;

    const configuracoes = await this.prisma.configuracaoAlerta.findMany({
      where,
      include: {
        prefeitura: {
          select: { id: true, nome: true },
        },
        regraAlerta: {
          select: { id: true, nome: true, tipo: true, descricao: true },
        },
      },
      orderBy: { created_date: 'desc' },
    });

    return {
      message: 'Configurações de alerta encontradas com sucesso',
      configuracoes,
    };
  }

  async findOne(id: number) {
    const configuracao = await this.prisma.configuracaoAlerta.findUnique({
      where: { id },
      include: {
        prefeitura: {
          select: { id: true, nome: true },
        },
        regraAlerta: {
          select: { id: true, nome: true, tipo: true, descricao: true },
        },
      },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração de alerta não encontrada');
    }

    return {
      message: 'Configuração de alerta encontrada com sucesso',
      configuracao,
    };
  }

  async update(id: number, updateConfiguracaoAlertaDto: UpdateConfiguracaoAlertaDto) {
    const existing = await this.prisma.configuracaoAlerta.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Configuração de alerta não encontrada');
    }

    const configuracao = await this.prisma.configuracaoAlerta.update({
      where: { id },
      data: updateConfiguracaoAlertaDto,
      include: {
        prefeitura: {
          select: { id: true, nome: true },
        },
        regraAlerta: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });

    return {
      message: 'Configuração de alerta atualizada com sucesso',
      configuracao,
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.configuracaoAlerta.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Configuração de alerta não encontrada');
    }

    await this.prisma.configuracaoAlerta.delete({
      where: { id },
    });

    return {
      message: 'Configuração de alerta excluída com sucesso',
    };
  }
}

