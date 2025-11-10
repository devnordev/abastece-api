import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusSolicitacao, TipoAbastecimentoSolicitacao } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSolicitacaoAbastecimentoDto } from './dto/create-solicitacao-abastecimento.dto';
import { UpdateSolicitacaoAbastecimentoDto } from './dto/update-solicitacao-abastecimento.dto';
import { FindSolicitacaoAbastecimentoDto } from './dto/find-solicitacao-abastecimento.dto';
import { UnauthorizedException } from '../../common/exceptions/business.exception';

@Injectable()
export class SolicitacaoAbastecimentoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly solicitacaoInclude = {
    prefeitura: {
      select: {
        id: true,
        nome: true,
        cnpj: true,
      },
    },
    veiculo: {
      select: {
        id: true,
        placa: true,
        descricao: true,
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
    abastecimento: {
      select: {
        id: true,
        data_abastecimento: true,
        quantidade: true,
      },
    },
  } as const;

  async create(createDto: CreateSolicitacaoAbastecimentoDto) {
    const data: Prisma.SolicitacaoAbastecimentoUncheckedCreateInput = {
      prefeituraId: createDto.prefeituraId,
      veiculoId: createDto.veiculoId,
      motoristaId: createDto.motoristaId,
      combustivelId: createDto.combustivelId,
      empresaId: createDto.empresaId,
      quantidade: this.toDecimal(createDto.quantidade),
      data_solicitacao: new Date(createDto.data_solicitacao),
      data_expiracao: new Date(createDto.data_expiracao),
      tipo_abastecimento: createDto.tipo_abastecimento,
      status: createDto.status ?? StatusSolicitacao.PENDENTE,
      nfe_chave_acesso: createDto.nfe_chave_acesso,
      nfe_img_url: createDto.nfe_img_url,
      motivo_rejeicao: createDto.motivo_rejeicao,
      aprovado_por: createDto.aprovado_por,
      aprovado_por_email: createDto.aprovado_por_email,
      aprovado_por_empresa: createDto.aprovado_por_empresa,
      data_aprovacao: createDto.data_aprovacao ? new Date(createDto.data_aprovacao) : undefined,
      rejeitado_por: createDto.rejeitado_por,
      rejeitado_por_email: createDto.rejeitado_por_email,
      rejeitado_por_empresa: createDto.rejeitado_por_empresa,
      data_rejeicao: createDto.data_rejeicao ? new Date(createDto.data_rejeicao) : undefined,
      conta_faturamento_orgao_id: createDto.conta_faturamento_orgao_id,
      abastecido_por: createDto.abastecido_por ?? 'Sistema',
      valor_total: createDto.valor_total !== undefined ? this.toDecimal(createDto.valor_total) : undefined,
      preco_empresa: createDto.preco_empresa !== undefined ? this.toDecimal(createDto.preco_empresa) : undefined,
      abastecimento_id: createDto.abastecimento_id,
      ativo: createDto.ativo ?? true,
      observacoes: createDto.observacoes,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const solicitacao = await this.prisma.solicitacaoAbastecimento.create({
      data,
      include: this.solicitacaoInclude,
    });

    return {
      message: 'Solicitação de abastecimento criada com sucesso',
      solicitacao,
    };
  }

  async findAll(query: FindSolicitacaoAbastecimentoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SolicitacaoAbastecimentoWhereInput = {};

    if (query.prefeituraId !== undefined) {
      where.prefeituraId = query.prefeituraId;
    }

    if (query.veiculoId !== undefined) {
      where.veiculoId = query.veiculoId;
    }

    if (query.motoristaId !== undefined) {
      where.motoristaId = query.motoristaId;
    }

    if (query.empresaId !== undefined) {
      where.empresaId = query.empresaId;
    }

    if (query.tipo_abastecimento !== undefined) {
      where.tipo_abastecimento = query.tipo_abastecimento;
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }

    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    const [solicitacoes, total] = await Promise.all([
      this.prisma.solicitacaoAbastecimento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.solicitacaoInclude,
      }),
      this.prisma.solicitacaoAbastecimento.count({ where }),
    ]);

    return {
      message: 'Solicitações de abastecimento encontradas com sucesso',
      solicitacoes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id },
      include: this.solicitacaoInclude,
    });

    if (!solicitacao) {
      throw new NotFoundException(`Solicitação de abastecimento com ID ${id} não encontrada`);
    }

    return {
      message: 'Solicitação de abastecimento encontrada com sucesso',
      solicitacao,
    };
  }

  async update(id: number, updateDto: UpdateSolicitacaoAbastecimentoDto) {
    await this.ensureExists(id);

    const data: Prisma.SolicitacaoAbastecimentoUncheckedUpdateInput = {
      prefeituraId: updateDto.prefeituraId,
      veiculoId: updateDto.veiculoId,
      motoristaId: updateDto.motoristaId,
      combustivelId: updateDto.combustivelId,
      empresaId: updateDto.empresaId,
      quantidade: updateDto.quantidade !== undefined ? this.toDecimal(updateDto.quantidade) : undefined,
      data_solicitacao: updateDto.data_solicitacao ? new Date(updateDto.data_solicitacao) : undefined,
      data_expiracao: updateDto.data_expiracao ? new Date(updateDto.data_expiracao) : undefined,
      tipo_abastecimento: updateDto.tipo_abastecimento as TipoAbastecimentoSolicitacao | undefined,
      status: updateDto.status as StatusSolicitacao | undefined,
      nfe_chave_acesso: updateDto.nfe_chave_acesso,
      nfe_img_url: updateDto.nfe_img_url,
      motivo_rejeicao: updateDto.motivo_rejeicao,
      aprovado_por: updateDto.aprovado_por,
      aprovado_por_email: updateDto.aprovado_por_email,
      aprovado_por_empresa: updateDto.aprovado_por_empresa,
      data_aprovacao: updateDto.data_aprovacao ? new Date(updateDto.data_aprovacao) : undefined,
      rejeitado_por: updateDto.rejeitado_por,
      rejeitado_por_email: updateDto.rejeitado_por_email,
      rejeitado_por_empresa: updateDto.rejeitado_por_empresa,
      data_rejeicao: updateDto.data_rejeicao ? new Date(updateDto.data_rejeicao) : undefined,
      conta_faturamento_orgao_id: updateDto.conta_faturamento_orgao_id,
      abastecido_por: updateDto.abastecido_por,
      valor_total: updateDto.valor_total !== undefined ? this.toDecimal(updateDto.valor_total) : undefined,
      preco_empresa: updateDto.preco_empresa !== undefined ? this.toDecimal(updateDto.preco_empresa) : undefined,
      abastecimento_id: updateDto.abastecimento_id,
      ativo: updateDto.ativo,
      observacoes: updateDto.observacoes,
      updated_at: new Date(),
    };

    const solicitacao = await this.prisma.solicitacaoAbastecimento.update({
      where: { id },
      data,
      include: this.solicitacaoInclude,
    });

    return {
      message: 'Solicitação de abastecimento atualizada com sucesso',
      solicitacao,
    };
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.solicitacaoAbastecimento.delete({
      where: { id },
    });

    return {
      message: 'Solicitação de abastecimento removida com sucesso',
    };
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Solicitação de abastecimento com ID ${id} não encontrada`);
    }
  }

  private toDecimal(value: number): Prisma.Decimal {
    return new Prisma.Decimal(value);
  }

  async listarVeiculosOrgaosDaPrefeitura(user: {
    id: number;
    tipo_usuario: string;
    prefeitura?: { id: number; nome: string; cnpj: string };
  }) {
    const prefeituraId = user?.prefeitura?.id;

    if (!prefeituraId) {
      throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
    }

    const veiculos = await this.prisma.veiculo.findMany({
      where: {
        prefeituraId,
        orgao: {
          prefeituraId,
        },
      },
      include: {
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
        combustiveis: {
          select: {
            combustivel: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          orgao: {
            nome: 'asc',
          },
        },
        {
          nome: 'asc',
        },
      ],
    });

    return {
      message: 'Veículos vinculados aos órgãos da prefeitura recuperados com sucesso',
      veiculos,
    };
  }
}

