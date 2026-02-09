import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto';

@Injectable()
export class RegraAlertaService {
  constructor(private prisma: PrismaService) {}

  async create(createRegraAlertaDto: CreateRegraAlertaDto) {
    const regra = await this.prisma.regraAlerta.create({
      data: {
        nome: createRegraAlertaDto.nome,
        descricao: createRegraAlertaDto.descricao,
        tipo: createRegraAlertaDto.tipo,
        ativo: createRegraAlertaDto.ativo ?? true,
      },
    });

    return {
      message: 'Regra de alerta criada com sucesso',
      regra,
    };
  }

  async findAll(ativo?: boolean) {
    const where: any = {};
    if (ativo !== undefined) where.ativo = ativo;

    const regras = await this.prisma.regraAlerta.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            configuracoes: true,
            alertas: true,
          },
        },
      },
    });

    return {
      message: 'Regras de alerta encontradas com sucesso',
      regras,
    };
  }

  async findOne(id: number) {
    const regra = await this.prisma.regraAlerta.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            configuracoes: true,
            alertas: true,
          },
        },
      },
    });

    if (!regra) {
      throw new NotFoundException('Regra de alerta não encontrada');
    }

    return {
      message: 'Regra de alerta encontrada com sucesso',
      regra,
    };
  }

  async update(id: number, updateRegraAlertaDto: UpdateRegraAlertaDto) {
    const existingRegra = await this.prisma.regraAlerta.findUnique({
      where: { id },
    });

    if (!existingRegra) {
      throw new NotFoundException('Regra de alerta não encontrada');
    }

    const regra = await this.prisma.regraAlerta.update({
      where: { id },
      data: updateRegraAlertaDto,
    });

    return {
      message: 'Regra de alerta atualizada com sucesso',
      regra,
    };
  }

  async remove(id: number) {
    const existingRegra = await this.prisma.regraAlerta.findUnique({
      where: { id },
    });

    if (!existingRegra) {
      throw new NotFoundException('Regra de alerta não encontrada');
    }

    await this.prisma.regraAlerta.delete({
      where: { id },
    });

    return {
      message: 'Regra de alerta excluída com sucesso',
    };
  }
}

