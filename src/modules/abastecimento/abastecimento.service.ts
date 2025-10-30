import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';

@Injectable()
export class AbastecimentoService {
  constructor(private prisma: PrismaService) {}

  async create(createAbastecimentoDto: CreateAbastecimentoDto) {
    const { veiculoId, combustivelId, empresaId } = createAbastecimentoDto;

    // Verificar se veículo existe
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
    });

    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado');
    }

    // Verificar se combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new NotFoundException('Combustível não encontrado');
    }

    // Verificar se empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Criar abastecimento
    const abastecimento = await this.prisma.abastecimento.create({
      data: {
        ...createAbastecimentoDto,
        data_abastecimento: createAbastecimentoDto.data_abastecimento 
          ? new Date(createAbastecimentoDto.data_abastecimento) 
          : new Date(),
      },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        validador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Abastecimento criado com sucesso',
      abastecimento,
    };
  }

  async findAll(findAbastecimentoDto: FindAbastecimentoDto) {
    const {
      veiculoId,
      motoristaId,
      combustivelId,
      empresaId,
      tipo_abastecimento,
      status,
      ativo,
      data_inicial,
      data_final,
      page = 1,
      limit = 10,
    } = findAbastecimentoDto;

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (veiculoId) {
      where.veiculoId = veiculoId;
    }

    if (motoristaId) {
      where.motoristaId = motoristaId;
    }

    if (combustivelId) {
      where.combustivelId = combustivelId;
    }

    if (empresaId) {
      where.empresaId = empresaId;
    }

    if (tipo_abastecimento) {
      where.tipo_abastecimento = tipo_abastecimento;
    }

    if (status) {
      where.status = status;
    }

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    if (data_inicial || data_final) {
      where.data_abastecimento = {};
      if (data_inicial) {
        where.data_abastecimento.gte = new Date(data_inicial);
      }
      if (data_final) {
        where.data_abastecimento.lte = new Date(data_final);
      }
    }

    // Buscar abastecimentos
    const [abastecimentos, total] = await Promise.all([
      this.prisma.abastecimento.findMany({
        where,
        skip,
        take: limit,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
            },
          },
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          combustivel: {
            select: {
              id: true,
              nome: true,
              sigla: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
          solicitante: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          validador: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          data_abastecimento: 'desc',
        },
      }),
      this.prisma.abastecimento.count({ where }),
    ]);

    return {
      message: 'Abastecimentos encontrados com sucesso',
      abastecimentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
            tipo_veiculo: true,
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            telefone: true,
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
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            endereco_completo: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
          },
        },
        validador: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipo_usuario: true,
          },
        },
        contaFaturamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
        cota: {
          select: {
            id: true,
            quantidade: true,
            quantidade_utilizada: true,
            restante: true,
          },
        },
      },
    });

    if (!abastecimento) {
      throw new NotFoundException('Abastecimento não encontrado');
    }

    return {
      message: 'Abastecimento encontrado com sucesso',
      abastecimento,
    };
  }

  async update(id: number, updateAbastecimentoDto: UpdateAbastecimentoDto) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new NotFoundException('Abastecimento não encontrado');
    }

    // Atualizar abastecimento
    const abastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        ...updateAbastecimentoDto,
        data_abastecimento: updateAbastecimentoDto.data_abastecimento 
          ? new Date(updateAbastecimentoDto.data_abastecimento) 
          : undefined,
      },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        validador: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Abastecimento atualizado com sucesso',
      abastecimento,
    };
  }

  async remove(id: number) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new NotFoundException('Abastecimento não encontrado');
    }

    // Excluir abastecimento
    await this.prisma.abastecimento.delete({
      where: { id },
    });

    return {
      message: 'Abastecimento excluído com sucesso',
    };
  }

  async approve(id: number, userId: number, userEmail: string) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new NotFoundException('Abastecimento não encontrado');
    }

    if (abastecimento.status !== 'Aguardando') {
      throw new BadRequestException('Abastecimento não está aguardando aprovação');
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: 'Aprovado',
        data_aprovacao: new Date(),
        aprovado_por: userEmail,
        validadorId: userId,
      },
    });

    return {
      message: 'Abastecimento aprovado com sucesso',
      abastecimento: updatedAbastecimento,
    };
  }

  async reject(id: number, userId: number, userEmail: string, motivo: string) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new NotFoundException('Abastecimento não encontrado');
    }

    if (abastecimento.status !== 'Aguardando') {
      throw new BadRequestException('Abastecimento não está aguardando aprovação');
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: 'Rejeitado',
        data_rejeicao: new Date(),
        rejeitado_por: userEmail,
        motivo_rejeicao: motivo,
        validadorId: userId,
      },
    });

    return {
      message: 'Abastecimento rejeitado com sucesso',
      abastecimento: updatedAbastecimento,
    };
  }
}
