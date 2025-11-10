import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Periodicidade,
  Prisma,
  StatusPreco,
  StatusSolicitacao,
  TipoAbastecimentoSolicitacao,
  TipoAbastecimentoVeiculo,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSolicitacaoAbastecimentoDto } from './dto/create-solicitacao-abastecimento.dto';
import { UpdateSolicitacaoAbastecimentoDto } from './dto/update-solicitacao-abastecimento.dto';
import { FindSolicitacaoAbastecimentoDto } from './dto/find-solicitacao-abastecimento.dto';
import { UnauthorizedException } from '../../common/exceptions/business.exception';
import {
  SolicitacaoAbastecimentoCombustivelNaoRelacionadoException,
  SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException,
  SolicitacaoAbastecimentoQuantidadeInvalidaException,
} from '../../common/exceptions';

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
    const dataSolicitacao = new Date(createDto.data_solicitacao);

    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: createDto.veiculoId },
      select: {
        id: true,
        prefeituraId: true,
        tipo_abastecimento: true,
        periodicidade: true,
        quantidade: true,
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo ${createDto.veiculoId} não foi encontrado`);
    }

    // Validar se o combustível está liberado para o veículo
    await this.validarCombustivelLiberadoParaVeiculo(
      createDto.combustivelId,
      createDto.veiculoId,
    );

    // Validar se o combustível tem preço definido na empresa
    await this.validarPrecoCombustivelEmpresa(
      createDto.combustivelId,
      createDto.empresaId,
    );

    if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA) {
      if (!veiculo.periodicidade || !veiculo.quantidade) {
        throw new SolicitacaoAbastecimentoQuantidadeInvalidaException(createDto.quantidade, undefined, {
          additionalInfo: {
            periodicidade: veiculo.periodicidade,
            quantidadeConfigurada: veiculo.quantidade,
          },
        });
      }

      const { inicio, fim } = this.obterIntervaloPeriodo(dataSolicitacao, veiculo.periodicidade);

      const statusConsiderados = [
        StatusSolicitacao.PENDENTE,
        StatusSolicitacao.APROVADA,
        StatusSolicitacao.EFETIVADA,
      ];

      const totalPeriodo = await this.prisma.solicitacaoAbastecimento.aggregate({
        _sum: { quantidade: true },
        where: {
          veiculoId: createDto.veiculoId,
          data_solicitacao: {
            gte: inicio,
            lte: fim,
          },
          status: {
            in: statusConsiderados,
          },
        },
      });

      const totalUtilizado = totalPeriodo._sum.quantidade
        ? Number(totalPeriodo._sum.quantidade.toString())
        : 0;
      const limite = Number(veiculo.quantidade.toString());
      const quantidadeSolicitada = createDto.quantidade;
      const novoTotal = totalUtilizado + quantidadeSolicitada;

      if (novoTotal > limite + Number.EPSILON) {
        const limiteDisponivel = Math.max(limite - totalUtilizado, 0);
        throw new SolicitacaoAbastecimentoQuantidadeInvalidaException(quantidadeSolicitada, limiteDisponivel, {
          additionalInfo: {
            limite,
            totalUtilizado,
            periodo: veiculo.periodicidade,
            intervalo: { inicio, fim },
          },
        });
      }
    }

    const data: Prisma.SolicitacaoAbastecimentoUncheckedCreateInput = {
      prefeituraId: createDto.prefeituraId,
      veiculoId: createDto.veiculoId,
      motoristaId: createDto.motoristaId,
      combustivelId: createDto.combustivelId,
      empresaId: createDto.empresaId,
      quantidade: this.toDecimal(createDto.quantidade),
      data_solicitacao: dataSolicitacao,
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
    const solicitacaoExistente = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id },
      select: {
        id: true,
        veiculoId: true,
        combustivelId: true,
        empresaId: true,
      },
    });

    if (!solicitacaoExistente) {
      throw new NotFoundException(`Solicitação de abastecimento com ID ${id} não encontrada`);
    }

    // Validações condicionais: só valida se os campos forem alterados
    const veiculoId = updateDto.veiculoId ?? solicitacaoExistente.veiculoId;
    const combustivelId = updateDto.combustivelId ?? solicitacaoExistente.combustivelId;
    const empresaId = updateDto.empresaId ?? solicitacaoExistente.empresaId;

    // Se combustivelId ou veiculoId foram alterados, validar relacionamento
    if (updateDto.combustivelId !== undefined || updateDto.veiculoId !== undefined) {
      await this.validarCombustivelLiberadoParaVeiculo(combustivelId, veiculoId);
    }

    // Se combustivelId ou empresaId foram alterados, validar preço
    if (updateDto.combustivelId !== undefined || updateDto.empresaId !== undefined) {
      await this.validarPrecoCombustivelEmpresa(combustivelId, empresaId);
    }

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

  /**
   * Valida se o combustível está liberado (permitido) para o veículo
   * Verifica se existe um registro ativo em VeiculoCombustivel
   */
  private async validarCombustivelLiberadoParaVeiculo(
    combustivelId: number,
    veiculoId: number,
  ): Promise<void> {
    const veiculoCombustivel = await this.prisma.veiculoCombustivel.findFirst({
      where: {
        veiculoId,
        combustivelId,
        ativo: true,
      },
    });

    if (!veiculoCombustivel) {
      throw new SolicitacaoAbastecimentoCombustivelNaoRelacionadoException(
        combustivelId,
        veiculoId,
      );
    }
  }

  /**
   * Valida se o combustível tem preço definido e ativo para a empresa
   * Verifica se existe um registro em EmpresaPrecoCombustivel com status ACTIVE
   * e preco_atual válido (maior que zero)
   */
  private async validarPrecoCombustivelEmpresa(
    combustivelId: number,
    empresaId: number,
  ): Promise<void> {
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      select: {
        id: true,
        preco_atual: true,
        status: true,
      },
    });

    if (!precoCombustivel) {
      throw new SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException(
        combustivelId,
        empresaId,
      );
    }

    // Verificar se o preço é válido (maior que zero)
    const precoAtual = Number(precoCombustivel.preco_atual);
    if (!precoAtual || precoAtual <= 0) {
      throw new SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException(
        combustivelId,
        empresaId,
        {
          additionalInfo: {
            motivo: 'Preço inválido (zero ou negativo)',
            preco_atual: precoAtual,
          },
        },
      );
    }
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

  async obterTipoAbastecimentoVeiculo(
    veiculoId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
    },
  ) {
    const prefeituraId = user?.prefeitura?.id;

    if (!prefeituraId) {
      throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
    }

    const veiculo = await this.prisma.veiculo.findFirst({
      where: {
        id: veiculoId,
        prefeituraId,
        orgao: {
          prefeituraId,
        },
      },
      select: {
        id: true,
        nome: true,
        placa: true,
        tipo_abastecimento: true,
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(
        `Veículo ${veiculoId} não foi encontrado entre os órgãos da prefeitura do usuário.`,
      );
    }

    return {
      message: 'Tipo de abastecimento recuperado com sucesso',
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        orgao: veiculo.orgao,
      },
    };
  }

  async listarCotasDoOrgao(
    orgaoId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
    },
  ) {
    const prefeituraId = user?.prefeitura?.id;

    if (!prefeituraId) {
      throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
    }

    const orgao = await this.prisma.orgao.findFirst({
      where: {
        id: orgaoId,
        prefeituraId,
      },
      select: {
        id: true,
        nome: true,
        sigla: true,
      },
    });

    if (!orgao) {
      throw new NotFoundException('Órgão não encontrado para a prefeitura do usuário.');
    }

    const cotas = await this.prisma.cotaOrgao.findMany({
      where: {
        orgaoId,
        processo: {
          prefeituraId,
        },
      },
      include: {
        processo: {
          select: {
            id: true,
            numero_processo: true,
            status: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return {
      message: 'Cotas do órgão recuperadas com sucesso',
      orgao,
      total: cotas.length,
      cotas,
    };
  }

  private obterIntervaloPeriodo(data: Date, periodicidade: Periodicidade) {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    if (periodicidade === Periodicidade.Diario) {
      return { inicio, fim };
    }

    if (periodicidade === Periodicidade.Semanal) {
      const diaSemana = inicio.getDay();
      const diffParaSegunda = (diaSemana + 6) % 7;
      inicio.setDate(inicio.getDate() - diffParaSegunda);

      fim.setTime(inicio.getTime());
      fim.setDate(inicio.getDate() + 6);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }

    if (periodicidade === Periodicidade.Mensal) {
      inicio.setDate(1);
      fim.setMonth(inicio.getMonth() + 1, 0);
      fim.setHours(23, 59, 59, 999);
      return { inicio, fim };
    }

    return { inicio, fim };
  }

  async listarEmpresasCredenciadas(user: {
    id: number;
    tipo_usuario: string;
    prefeitura?: { id: number; nome: string; cnpj: string };
  }) {
    const prefeituraId = user?.prefeitura?.id;

    if (!prefeituraId) {
      throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
    }

    const empresas = await this.prisma.empresa.findMany({
      where: {
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        endereco: true,
        uf: true,
        contato: true,
        telefone: true,
        email: true,
        website: true,
        tipo_empresa: true,
        isPublic: true,
      },
      orderBy: { nome: 'asc' },
    });

    return {
      message: 'Empresas credenciadas recuperadas com sucesso',
      total: empresas.length,
      empresas,
    };
  }

  async listarCombustiveisCredenciados(
    empresaId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
    },
  ) {
    const prefeituraId = user?.prefeitura?.id;

    if (!prefeituraId) {
      throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        ativo: true,
        uf: true,
      },
    });

    if (!empresa || !empresa.ativo) {
      throw new NotFoundException('Empresa não encontrada ou inativa.');
    }

    const combustiveis = await this.prisma.empresaPrecoCombustivel.findMany({
      where: {
        empresa_id: empresaId,
        status: 'ACTIVE',
      },
      include: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            ativo: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return {
      message: 'Combustíveis credenciados recuperados com sucesso',
      empresa,
      total: combustiveis.length,
      combustiveis,
    };
  }

  /**
   * Busca o preço atual de um combustível para uma empresa
   * Retorna o preço_atual do registro ativo em EmpresaPrecoCombustivel
   */
  async obterPrecoCombustivel(combustivelId: number, empresaId: number) {
    // Verificar se o combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
      select: {
        id: true,
        nome: true,
        sigla: true,
        ativo: true,
      },
    });

    if (!combustivel) {
      throw new NotFoundException(`Combustível com ID ${combustivelId} não encontrado`);
    }

    if (!combustivel.ativo) {
      throw new NotFoundException(`Combustível com ID ${combustivelId} está inativo`);
    }

    // Verificar se a empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        ativo: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${empresaId} não encontrada`);
    }

    if (!empresa.ativo) {
      throw new NotFoundException(`Empresa com ID ${empresaId} está inativa`);
    }

    // Buscar o preço ativo do combustível para a empresa
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      select: {
        id: true,
        preco_atual: true,
        teto_vigente: true,
        anp_base: true,
        anp_base_valor: true,
        margem_app_pct: true,
        uf_referencia: true,
        status: true,
        updated_at: true,
        updated_by: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    if (!precoCombustivel) {
      throw new SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException(
        combustivelId,
        empresaId,
      );
    }

    return {
      message: 'Preço do combustível recuperado com sucesso',
      preco: {
        id: precoCombustivel.id,
        preco_atual: Number(precoCombustivel.preco_atual),
        teto_vigente: Number(precoCombustivel.teto_vigente),
        anp_base: precoCombustivel.anp_base,
        anp_base_valor: Number(precoCombustivel.anp_base_valor),
        margem_app_pct: Number(precoCombustivel.margem_app_pct),
        uf_referencia: precoCombustivel.uf_referencia,
        status: precoCombustivel.status,
        updated_at: precoCombustivel.updated_at,
        updated_by: precoCombustivel.updated_by,
        empresa: precoCombustivel.empresa,
        combustivel: precoCombustivel.combustivel,
      },
    };
  }
}

