import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Periodicidade,
  Prisma,
  StatusPreco,
  StatusProcesso,
  StatusSolicitacao,
  TipoAbastecimentoSolicitacao,
  TipoAbastecimentoVeiculo,
  TipoContrato,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSolicitacaoAbastecimentoDto } from './dto/create-solicitacao-abastecimento.dto';
import { UpdateSolicitacaoAbastecimentoDto } from './dto/update-solicitacao-abastecimento.dto';
import { FindSolicitacaoAbastecimentoDto } from './dto/find-solicitacao-abastecimento.dto';
import { UnauthorizedException } from '../../common/exceptions/business.exception';
import {
  SolicitacaoAbastecimentoCombustivelNaoRelacionadoException,
  SolicitacaoAbastecimentoCombustivelPrecoNaoDefinidoException,
  SolicitacaoAbastecimentoQuantidadeInvalidaException,
  SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException,
  SolicitacaoAbastecimentoMotoristaNaoVinculadoVeiculoException,
  SolicitacaoAbastecimentoVeiculoSemOrgaoException,
  SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException,
  SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException,
  SolicitacaoAbastecimentoCotaOrgaoInsuficienteLivreException,
  SolicitacaoAbastecimentoCotaOrgaoInsuficienteComCotaException,
  SolicitacaoAbastecimentoCotaOrgaoInsuficienteComAutorizacaoException,
  SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException,
  SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException,
  SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException,
  SolicitacaoAbastecimentoPeriodoLimiteNaoConfiguradoException,
  SolicitacaoAbastecimentoPeriodoLimiteExcedidoException,
  SolicitacaoAbastecimentoVeiculoNaoPertencePrefeituraException,
} from '../../common/exceptions';

type SolicitacaoBasicaComVeiculo = {
  id: number;
  veiculoId: number;
  quantidade: Decimal;
  data_solicitacao: Date;
  data_expiracao: Date | null;
  status: StatusSolicitacao;
  veiculo?: {
    id: number;
    tipo_abastecimento?: TipoAbastecimentoVeiculo | null;
    periodicidade?: Periodicidade | null;
  } | null;
};

type SolicitacaoComVeiculoCota = SolicitacaoBasicaComVeiculo & {
  veiculo: {
    id: number;
    tipo_abastecimento: TipoAbastecimentoVeiculo;
    periodicidade: Periodicidade;
  };
};

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
        nome: true,
        orgaoId: true,
        tipo_abastecimento: true,
        periodicidade: true,
        orgao: {
          select: {
            id: true,
            nome: true,
          },
        },
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

  private readonly defaultTimezoneOffset = '-03:00';
  private readonly timezoneSuffixRegex = /([zZ]|[+\-]\d{2}:\d{2})$/;
  private readonly timezoneOffsetMinutes = -3 * 60; // America/Fortaleza (UTC-3)

  /**
   * Formata uma data mantendo o horário original (sem conversão de timezone)
   * Útil para exibir datas que já estão no horário local desejado
   */
  private formatarDataMantendoHorario(date: Date | null | undefined): string | null {
    if (!date) return null;
    
    // Extrai os componentes da data UTC e formata mantendo o horário
    const ano = date.getUTCFullYear();
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(date.getUTCDate()).padStart(2, '0');
    const horas = String(date.getUTCHours()).padStart(2, '0');
    const minutos = String(date.getUTCMinutes()).padStart(2, '0');
    const segundos = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${dia}/${mes}/${ano}, ${horas}:${minutos}:${segundos}`;
  }

  private adicionarInfoOrgaoSolicitacao<
    T extends {
      veiculo?: {
        orgaoId?: number | null;
        orgao?: { id: number | null; nome: string | null } | null;
      } | null;
    },
  >(registro: T): T & { orgaoId: number | null; orgaoNome: string | null } {
    const orgaoId = registro?.veiculo?.orgao?.id ?? registro?.veiculo?.orgaoId ?? null;
    const orgaoNome = registro?.veiculo?.orgao?.nome ?? null;

    return {
      ...registro,
      orgaoId,
      orgaoNome,
    };
  }

  async create(createDto: CreateSolicitacaoAbastecimentoDto) {
    const dataSolicitacao = this.ensureDate(
      this.normalizeDateInput(createDto.data_solicitacao),
      'data_solicitacao',
    );
    const dataExpiracao = this.ensureDate(
      this.normalizeDateInput(createDto.data_expiracao),
      'data_expiracao',
    );

    // Buscar veículo com todos os dados necessários
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: createDto.veiculoId },
      include: {
        orgao: {
          select: {
            id: true,
            prefeituraId: true,
          },
        },
        combustiveis: {
          where: {
            ativo: true,
          },
          select: {
            combustivelId: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo ${createDto.veiculoId} não foi encontrado`);
    }

    // Validar se o veículo pertence à prefeitura do usuário
    if (veiculo.prefeituraId !== createDto.prefeituraId) {
      throw new SolicitacaoAbastecimentoVeiculoNaoPertencePrefeituraException(
        createDto.veiculoId,
        createDto.prefeituraId,
        {
          payload: createDto,
        },
      );
    }

    // Validar se o motorista está vinculado ao veículo (se informado)
    if (createDto.motoristaId) {
      const veiculoMotorista = await this.prisma.veiculoMotorista.findFirst({
        where: {
          veiculoId: createDto.veiculoId,
          motoristaId: createDto.motoristaId,
          ativo: true,
        },
      });

      if (!veiculoMotorista) {
        throw new SolicitacaoAbastecimentoMotoristaNaoVinculadoVeiculoException(
          createDto.motoristaId,
          createDto.veiculoId,
          {
            payload: createDto,
          },
        );
      }
    }

    // Validar se o combustível está entre os combustíveis cadastrados do veículo
    const combustivelVinculado = veiculo.combustiveis.find(
      (vc) => vc.combustivelId === createDto.combustivelId,
    );

    if (!combustivelVinculado) {
      throw new SolicitacaoAbastecimentoCombustivelNaoRelacionadoException(
        createDto.combustivelId,
        createDto.veiculoId,
      );
    }

    // Validar se a quantidade solicitada excede a capacidade do tanque do veículo
    if (veiculo.capacidade_tanque) {
      const capacidadeTanque = Number(veiculo.capacidade_tanque.toString());
      const quantidadeSolicitada = createDto.quantidade;

      if (capacidadeTanque > 0 && quantidadeSolicitada > capacidadeTanque) {
        throw new SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException(
          quantidadeSolicitada,
          capacidadeTanque,
          createDto.veiculoId,
          {
            payload: createDto,
          },
        );
      }
    }

    // Validar se o combustível tem preço definido na empresa
    await this.validarPrecoCombustivelEmpresa(createDto.combustivelId, createDto.empresaId);

    // Validar periodicidade e tipo de abastecimento
    await this.validarRegrasAbastecimento(
      veiculo,
      createDto.quantidade,
      createDto.combustivelId,
      dataSolicitacao,
      createDto.tipo_abastecimento,
      createDto.prefeituraId,
    );

    // Verificar e liberar litros de solicitações expiradas para este veículo
    await this.liberarLitrosSolicitacoesExpiradas(createDto.veiculoId);

    // Processar todas as solicitações expiradas do sistema (em background, não bloqueia)
    // Isso garante que solicitações de outros veículos também sejam processadas
    this.processarSolicitacoesExpiradas().catch((error) => {
      console.error('Erro ao processar solicitações expiradas em background:', error);
    });

    // Criar solicitação e atualizar VeiculoCotaPeriodo em transação
    const solicitacao = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.SolicitacaoAbastecimentoUncheckedCreateInput = {
        prefeituraId: createDto.prefeituraId,
        veiculoId: createDto.veiculoId,
        motoristaId: createDto.motoristaId,
        combustivelId: createDto.combustivelId,
        empresaId: createDto.empresaId,
        quantidade: this.toDecimal(createDto.quantidade),
        data_solicitacao: dataSolicitacao,
        data_expiracao: dataExpiracao,
        tipo_abastecimento: createDto.tipo_abastecimento,
        status: createDto.status ?? StatusSolicitacao.PENDENTE,
        nfe_chave_acesso: createDto.nfe_chave_acesso,
        nfe_img_url: createDto.nfe_img_url,
        motivo_rejeicao: createDto.motivo_rejeicao,
        aprovado_por: createDto.aprovado_por,
        aprovado_por_email: createDto.aprovado_por_email,
        aprovado_por_empresa: createDto.aprovado_por_empresa,
        data_aprovacao: this.normalizeDateInput(createDto.data_aprovacao),
        rejeitado_por: createDto.rejeitado_por,
        rejeitado_por_email: createDto.rejeitado_por_email,
        rejeitado_por_empresa: createDto.rejeitado_por_empresa,
        data_rejeicao: this.normalizeDateInput(createDto.data_rejeicao),
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

      const novaSolicitacao = await tx.solicitacaoAbastecimento.create({
        data,
        include: this.solicitacaoInclude,
      });

      // Se o veículo for do tipo COM_COTA, atualizar VeiculoCotaPeriodo
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade && veiculo.quantidade) {
        const quantidadePermitida = Number(veiculo.quantidade.toString());
        await this.atualizarVeiculoCotaPeriodo(
          tx,
          veiculo.id,
          veiculo.periodicidade,
          dataSolicitacao,
          createDto.quantidade,
          quantidadePermitida,
        );
      }

      return novaSolicitacao;
    });

    // Log das datas quando uma nova solicitação é gerada
    const dataAtualServidor = new Date();
    console.log('[SolicitacaoAbastecimento] Nova solicitação criada:', {
      solicitacaoId: solicitacao.id,
      dataAtualServidor: dataAtualServidor.toISOString(),
      dataAtualServidorFormatada: dataAtualServidor.toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' }),
      data_solicitacao: solicitacao.data_solicitacao?.toISOString(),
      data_solicitacaoFormatada: this.formatarDataMantendoHorario(solicitacao.data_solicitacao),
      data_expiracao: solicitacao.data_expiracao?.toISOString() || null,
      data_expiracaoFormatada: this.formatarDataMantendoHorario(solicitacao.data_expiracao),
    });

    const solicitacaoComOrgao = this.adicionarInfoOrgaoSolicitacao(solicitacao);

    return {
      message: 'Solicitação de abastecimento criada com sucesso',
      solicitacao: this.formatSolicitacaoResponse(solicitacaoComOrgao),
    };
  }

  async findAll(query: FindSolicitacaoAbastecimentoDto) {
    // Processar solicitações expiradas em background (não bloqueia a resposta)
    this.processarSolicitacoesExpiradas().catch((error) => {
      console.error('Erro ao processar solicitações expiradas em background:', error);
    });

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

    await this.expirarSolicitacoesDaLista(solicitacoes as SolicitacaoBasicaComVeiculo[]);

    const solicitacoesComOrgao = solicitacoes.map((item) =>
      this.formatSolicitacaoResponse(this.adicionarInfoOrgaoSolicitacao(item)),
    );

    return {
      message: 'Solicitações de abastecimento encontradas com sucesso',
      solicitacoes: solicitacoesComOrgao,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByPrefeitura(
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
    query: FindSolicitacaoAbastecimentoDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SolicitacaoAbastecimentoWhereInput = {};

    // Filtrar por prefeitura se for ADMIN_PREFEITURA
    if (user.tipo_usuario === 'ADMIN_PREFEITURA') {
      const prefeituraId = user?.prefeitura?.id;

      if (!prefeituraId) {
        throw new UnauthorizedException('Usuário não está vinculado a uma prefeitura ativa.');
      }

      where.prefeituraId = prefeituraId;
    }

    // Filtrar por empresa se for ADMIN_EMPRESA ou COLABORADOR_EMPRESA
    if (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA') {
      const empresaId = user?.empresa?.id;

      if (!empresaId) {
        throw new UnauthorizedException('Usuário não está vinculado a uma empresa ativa.');
      }

      // Se empresaId foi passado na query, validar se é a mesma empresa do usuário
      if (query.empresaId !== undefined) {
        if (query.empresaId !== empresaId) {
          throw new UnauthorizedException('Você só pode visualizar solicitações da sua própria empresa.');
        }
        where.empresaId = query.empresaId;
      } else {
        // Se não foi passado, filtrar pela empresa do usuário
        where.empresaId = empresaId;
      }
    }

    // Aplicar filtros adicionais se fornecidos
    if (query.veiculoId !== undefined) {
      where.veiculoId = query.veiculoId;
    }

    if (query.motoristaId !== undefined) {
      where.motoristaId = query.motoristaId;
    }

    // Para ADMIN_EMPRESA ou COLABORADOR_EMPRESA, empresaId já foi tratado acima
    if (user.tipo_usuario !== 'ADMIN_EMPRESA' && user.tipo_usuario !== 'COLABORADOR_EMPRESA' && query.empresaId !== undefined) {
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

    await this.expirarSolicitacoesDaLista(solicitacoes as SolicitacaoBasicaComVeiculo[]);

    const solicitacoesComOrgao = solicitacoes.map((item) =>
      this.formatSolicitacaoResponse(this.adicionarInfoOrgaoSolicitacao(item)),
    );

    const response: any = {
      message: 'Solicitações de abastecimento encontradas com sucesso',
      solicitacoes: solicitacoesComOrgao,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Adicionar informações do contexto (prefeitura ou empresa)
    if (user.tipo_usuario === 'ADMIN_PREFEITURA' && user.prefeitura) {
      response.prefeitura = {
        id: user.prefeitura.id,
        nome: user.prefeitura.nome,
        cnpj: user.prefeitura.cnpj,
      };
    } else if ((user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA') && user.empresa) {
      response.empresa = {
        id: user.empresa.id,
        nome: user.empresa.nome,
        cnpj: user.empresa.cnpj,
        uf: user.empresa.uf,
      };
    }

    return response;
  }

  async findAllByVeiculoId(
    veiculoId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
    query: FindSolicitacaoAbastecimentoDto,
  ) {
    const mergedQuery: FindSolicitacaoAbastecimentoDto = {
      ...query,
      veiculoId,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    };

    return this.findAllByPrefeitura(user, mergedQuery);
  }

  async findOne(id: number) {
    // Processar solicitações expiradas em background (não bloqueia a resposta)
    this.processarSolicitacoesExpiradas().catch((error) => {
      console.error('Erro ao processar solicitações expiradas em background:', error);
    });

    const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id },
      include: this.solicitacaoInclude,
    });

    if (!solicitacao) {
      throw new NotFoundException(`Solicitação de abastecimento com ID ${id} não encontrada`);
    }

    await this.expirarSolicitacaoSeNecessario(solicitacao as SolicitacaoBasicaComVeiculo);

    const solicitacaoComOrgao = this.adicionarInfoOrgaoSolicitacao(solicitacao);

    return {
      message: 'Solicitação de abastecimento encontrada com sucesso',
      solicitacao: this.formatSolicitacaoResponse(solicitacaoComOrgao),
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

    // Se quantidade ou veiculoId foram alterados, validar capacidade do tanque
    if (updateDto.quantidade !== undefined || updateDto.veiculoId !== undefined) {
      const veiculo = await this.prisma.veiculo.findUnique({
        where: { id: veiculoId },
        select: {
          id: true,
          capacidade_tanque: true,
        },
      });

      if (veiculo && veiculo.capacidade_tanque && updateDto.quantidade !== undefined) {
        const capacidadeTanque = Number(veiculo.capacidade_tanque.toString());
        const quantidadeSolicitada = updateDto.quantidade;

        // Validar apenas se a capacidade do tanque for maior que zero
        if (capacidadeTanque > 0 && quantidadeSolicitada > capacidadeTanque) {
          throw new SolicitacaoAbastecimentoQuantidadeExcedeCapacidadeTanqueException(
            quantidadeSolicitada,
            capacidadeTanque,
            veiculoId,
            {
              resourceId: id,
              payload: updateDto,
            }
          );
        }
      }
    }

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
      data_solicitacao: this.normalizeDateInput(updateDto.data_solicitacao),
      data_expiracao: this.normalizeDateInput(updateDto.data_expiracao),
      tipo_abastecimento: updateDto.tipo_abastecimento as TipoAbastecimentoSolicitacao | undefined,
      status: updateDto.status as StatusSolicitacao | undefined,
      nfe_chave_acesso: updateDto.nfe_chave_acesso,
      nfe_img_url: updateDto.nfe_img_url,
      motivo_rejeicao: updateDto.motivo_rejeicao,
      aprovado_por: updateDto.aprovado_por,
      aprovado_por_email: updateDto.aprovado_por_email,
      aprovado_por_empresa: updateDto.aprovado_por_empresa,
      data_aprovacao: this.normalizeDateInput(updateDto.data_aprovacao),
      rejeitado_por: updateDto.rejeitado_por,
      rejeitado_por_email: updateDto.rejeitado_por_email,
      rejeitado_por_empresa: updateDto.rejeitado_por_empresa,
      data_rejeicao: this.normalizeDateInput(updateDto.data_rejeicao),
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

    const solicitacaoComOrgao = this.adicionarInfoOrgaoSolicitacao(solicitacao);

    return {
      message: 'Solicitação de abastecimento atualizada com sucesso',
      solicitacao: this.formatSolicitacaoResponse(solicitacaoComOrgao),
    };
  }

  async updateStatus(id: number, updateStatusDto: { status: StatusSolicitacao; motivo_rejeicao?: string; aprovado_por?: string; aprovado_por_email?: string; aprovado_por_empresa?: string; rejeitado_por?: string; rejeitado_por_email?: string; rejeitado_por_empresa?: string }, user?: any) {
    const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id },
      include: {
        veiculo: {
          select: {
            id: true,
            tipo_abastecimento: true,
            periodicidade: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new NotFoundException(`Solicitação de abastecimento com ID ${id} não encontrada`);
    }

    // Preparar dados de atualização baseado no novo status
    const updateData: Prisma.SolicitacaoAbastecimentoUncheckedUpdateInput = {
      status: updateStatusDto.status,
      updated_at: new Date(),
    };

    // Se o status for APROVADA, preencher campos de aprovação
    if (updateStatusDto.status === StatusSolicitacao.APROVADA) {
      updateData.data_aprovacao = new Date();
      updateData.aprovado_por = updateStatusDto.aprovado_por || user?.nome || undefined;
      updateData.aprovado_por_email = updateStatusDto.aprovado_por_email || user?.email || undefined;
      updateData.aprovado_por_empresa = updateStatusDto.aprovado_por_empresa || user?.empresa?.nome || undefined;
      // Limpar campos de rejeição se existirem
      updateData.data_rejeicao = null;
      updateData.rejeitado_por = null;
      updateData.rejeitado_por_email = null;
      updateData.rejeitado_por_empresa = null;
      updateData.motivo_rejeicao = null;
    }

    // Se o status for REJEITADA, preencher campos de rejeição
    if (updateStatusDto.status === StatusSolicitacao.REJEITADA) {
      updateData.data_rejeicao = new Date();
      updateData.rejeitado_por = updateStatusDto.rejeitado_por || user?.nome || undefined;
      updateData.rejeitado_por_email = updateStatusDto.rejeitado_por_email || user?.email || undefined;
      updateData.rejeitado_por_empresa = updateStatusDto.rejeitado_por_empresa || user?.empresa?.nome || undefined;
      updateData.motivo_rejeicao = updateStatusDto.motivo_rejeicao || undefined;
      // Limpar campos de aprovação se existirem
      updateData.data_aprovacao = null;
      updateData.aprovado_por = null;
      updateData.aprovado_por_email = null;
      updateData.aprovado_por_empresa = null;
    }

    // Se o status for EXPIRADA, liberar litros da cota período
    if (updateStatusDto.status === StatusSolicitacao.EXPIRADA) {
      // Verificar se precisa liberar litros (apenas se status anterior era PENDENTE ou APROVADA)
      const statusAnterior = solicitacao.status;
      if (
        (statusAnterior === StatusSolicitacao.PENDENTE || statusAnterior === StatusSolicitacao.APROVADA) &&
        solicitacao.veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA &&
        solicitacao.veiculo.periodicidade
      ) {
        await this.liberarLitrosSolicitacaoExpirada(solicitacao);
      }
    }

    // Se o status for EFETIVADA, apenas atualizar o status
    if (updateStatusDto.status === StatusSolicitacao.EFETIVADA) {
      // Não alterar outros campos
    }

    // Se o status for PENDENTE, limpar campos de aprovação e rejeição
    if (updateStatusDto.status === StatusSolicitacao.PENDENTE) {
      updateData.data_aprovacao = null;
      updateData.aprovado_por = null;
      updateData.aprovado_por_email = null;
      updateData.aprovado_por_empresa = null;
      updateData.data_rejeicao = null;
      updateData.rejeitado_por = null;
      updateData.rejeitado_por_email = null;
      updateData.rejeitado_por_empresa = null;
      updateData.motivo_rejeicao = null;
    }

    const solicitacaoAtualizada = await this.prisma.solicitacaoAbastecimento.update({
      where: { id },
      data: updateData,
      include: this.solicitacaoInclude,
    });

    const solicitacaoComOrgao = this.adicionarInfoOrgaoSolicitacao(solicitacaoAtualizada);

    return {
      message: `Status da solicitação alterado para ${updateStatusDto.status}`,
      solicitacao: this.formatSolicitacaoResponse(solicitacaoComOrgao),
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

  /**
   * Valida todas as regras de negócio para criação de solicitação de abastecimento
   * baseado na periodicidade e tipo de abastecimento do veículo
   * 
   * IMPORTANTE: A periodicidade (Diário, Semanal, Mensal) é APENAS para veículos
   * com tipo_abastecimento = COM_COTA, e é gerenciada através de VeiculoCotaPeriodo
   */
  private async validarRegrasAbastecimento(
    veiculo: {
      id: number;
      prefeituraId: number;
      tipo_abastecimento: TipoAbastecimentoVeiculo;
      periodicidade: Periodicidade | null;
      quantidade: Decimal | null;
      orgao: { id: number; prefeituraId: number } | null;
    },
    quantidade: number,
    combustivelId: number,
    dataSolicitacao: Date,
    tipoAbastecimentoSolicitacao: TipoAbastecimentoSolicitacao,
    prefeituraId: number,
  ): Promise<void> {
    // Se tipo de abastecimento é LIVRE
    if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.LIVRE) {
      // Para LIVRE, apenas validar CotaOrgao (capacidade_tanque já foi validada anteriormente)
      await this.validarCotaOrgaoParaLivre(
        prefeituraId,
        veiculo.orgao?.id,
        combustivelId,
        quantidade,
      );
    }
    // Se tipo de abastecimento é COM_COTA
    else if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA) {
      // Se tem periodicidade, validar VeiculoCotaPeriodo
      if (veiculo.periodicidade) {
        await this.validarVeiculoCotaPeriodo(
          veiculo.id,
          veiculo.periodicidade,
          dataSolicitacao,
          quantidade,
        );
      }
      
      // Sempre validar CotaOrgao para COM_COTA
      await this.validarCotaOrgaoParaComCota(
        prefeituraId,
        veiculo.orgao?.id,
        combustivelId,
        quantidade,
      );
    }
    // Se tipo de abastecimento é COM_AUTORIZACAO
    else if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COM_AUTORIZACAO) {
      // Validar apenas CotaOrgao (não usa periodicidade do veículo)
      await this.validarCotaOrgaoParaComAutorizacao(
        prefeituraId,
        veiculo.orgao?.id,
        combustivelId,
        quantidade,
      );
    }
  }

  /**
   * Valida CotaOrgao para tipo LIVRE
   * Verifica se o restante da cota do órgão é maior ou igual à quantidade solicitada
   */
  private async validarCotaOrgaoParaLivre(
    prefeituraId: number,
    orgaoId: number | null | undefined,
    combustivelId: number,
    quantidade: number,
  ): Promise<void> {
    if (!orgaoId) {
      throw new SolicitacaoAbastecimentoVeiculoSemOrgaoException(0, 'LIVRE', {
        additionalInfo: {
          tipoAbastecimento: 'LIVRE',
        },
      });
    }

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
    });

    if (!processo) {
      throw new SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException(prefeituraId);
    }

    // Buscar CotaOrgao para o órgão, combustível e processo
    const cotaOrgao = await this.prisma.cotaOrgao.findFirst({
      where: {
        processoId: processo.id,
        orgaoId,
        combustivelId,
        ativa: true,
      },
    });

    if (!cotaOrgao) {
      throw new SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException(
        orgaoId,
        combustivelId,
        processo.id,
      );
    }

    const restante = cotaOrgao.restante ? Number(cotaOrgao.restante.toString()) : 0;

    // Verificar se o restante é maior ou igual à quantidade solicitada
    if (restante < quantidade) {
      throw new SolicitacaoAbastecimentoCotaOrgaoInsuficienteLivreException(
        quantidade,
        restante,
        orgaoId,
        combustivelId,
      );
    }
  }

  /**
   * Valida VeiculoCotaPeriodo para tipo COM_COTA com qualquer periodicidade (Diário, Semanal, Mensal)
   * Verifica se a quantidade_disponivel é suficiente para a quantidade solicitada
   */
  private async validarVeiculoCotaPeriodo(
    veiculoId: number,
    periodicidade: Periodicidade,
    dataSolicitacao: Date,
    quantidade: number,
  ): Promise<void> {
    // Buscar a cota de período ativa que contém a data da solicitação
    const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId,
        periodicidade,
        data_inicio_periodo: { lte: dataSolicitacao },
        data_fim_periodo: { gte: dataSolicitacao },
        ativo: true,
      },
      orderBy: {
        data_inicio_periodo: 'desc',
      },
    });

    if (!cotaPeriodo) {
      throw new SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException(
        veiculoId,
        periodicidade,
        dataSolicitacao,
      );
    }

    const quantidadeDisponivel = Number(cotaPeriodo.quantidade_disponivel.toString());
    const quantidadePermitida = Number(cotaPeriodo.quantidade_permitida.toString());
    const quantidadeUtilizada = Number(cotaPeriodo.quantidade_utilizada.toString());

    // Se quantidade_disponivel for zero, não permitir
    if (quantidadeDisponivel <= 0) {
      throw new SolicitacaoAbastecimentoVeiculoCotaPeriodoEsgotadaException(
        veiculoId,
        periodicidade,
        quantidadePermitida,
        quantidadeUtilizada,
        quantidadeDisponivel,
      );
    }

    // Se a quantidade solicitada for maior que a quantidade_disponivel, não permitir
    // Permitir quando quantidade_disponivel >= quantidade (permite igualdade)
    if (quantidade > quantidadeDisponivel) {
      throw new SolicitacaoAbastecimentoVeiculoCotaPeriodoQuantidadeInsuficienteException(
        quantidade,
        quantidadeDisponivel,
        veiculoId,
        periodicidade,
        quantidadePermitida,
        quantidadeUtilizada,
      );
    }
  }

  /**
   * Valida CotaOrgao para tipo COM_COTA
   */
  private async validarCotaOrgaoParaComCota(
    prefeituraId: number,
    orgaoId: number | null | undefined,
    combustivelId: number,
    quantidade: number,
  ): Promise<void> {
    if (!orgaoId) {
      throw new SolicitacaoAbastecimentoVeiculoSemOrgaoException(0, 'COM_COTA', {
        additionalInfo: {
          tipoAbastecimento: 'COM_COTA',
        },
      });
    }

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
    });

    if (!processo) {
      throw new SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException(prefeituraId);
    }

    // Buscar CotaOrgao para o órgão, combustível e processo
    const cotaOrgao = await this.prisma.cotaOrgao.findFirst({
      where: {
        processoId: processo.id,
        orgaoId,
        combustivelId,
        ativa: true,
      },
    });

    if (!cotaOrgao) {
      throw new SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException(
        orgaoId,
        combustivelId,
        processo.id,
      );
    }

    const restante = cotaOrgao.restante ? Number(cotaOrgao.restante.toString()) : 0;

    if (quantidade > restante) {
      throw new SolicitacaoAbastecimentoCotaOrgaoInsuficienteComCotaException(
        quantidade,
        restante,
        orgaoId,
        combustivelId,
      );
    }
  }

  /**
   * Valida CotaOrgao para tipo COM_AUTORIZACAO
   */
  private async validarCotaOrgaoParaComAutorizacao(
    prefeituraId: number,
    orgaoId: number | null | undefined,
    combustivelId: number,
    quantidade: number,
  ): Promise<void> {
    if (!orgaoId) {
      throw new SolicitacaoAbastecimentoVeiculoSemOrgaoException(0, 'COM_AUTORIZACAO', {
        additionalInfo: {
          tipoAbastecimento: 'COM_AUTORIZACAO',
        },
      });
    }

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
    });

    if (!processo) {
      throw new SolicitacaoAbastecimentoProcessoAtivoNaoEncontradoException(prefeituraId);
    }

    // Buscar CotaOrgao para o órgão, combustível e processo
    const cotaOrgao = await this.prisma.cotaOrgao.findFirst({
      where: {
        processoId: processo.id,
        orgaoId,
        combustivelId,
        ativa: true,
      },
    });

    if (!cotaOrgao) {
      throw new SolicitacaoAbastecimentoCotaOrgaoNaoEncontradaException(
        orgaoId,
        combustivelId,
        processo.id,
      );
    }

    const restante = cotaOrgao.restante ? Number(cotaOrgao.restante.toString()) : 0;

    if (quantidade > restante) {
      throw new SolicitacaoAbastecimentoCotaOrgaoInsuficienteComAutorizacaoException(
        quantidade,
        restante,
        orgaoId,
        combustivelId,
      );
    }
  }

  private toDecimal(value: number): Decimal {
    return new Decimal(value);
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
        periodicidade: true,
        quantidade: true,
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

    const resposta: any = {
      message: 'Tipo de abastecimento recuperado com sucesso',
      veiculoId: veiculo.id,
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        orgao: veiculo.orgao,
      },
    };

    // Se o tipo for COTA ou COM_AUTORIZACAO, incluir periodicidade e quantidade
    if (
      veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA ||
      veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COM_AUTORIZACAO
    ) {
      resposta.veiculo.periodicidade = veiculo.periodicidade;
      resposta.veiculo.quantidade = veiculo.quantidade ? Number(veiculo.quantidade) : null;

      // Verificar se há abastecimentos para este veículo
      const temAbastecimentos = await this.prisma.abastecimento.findFirst({
        where: {
          veiculoId: veiculoId,
          ativo: true,
        },
        select: {
          id: true,
        },
      });

      if (temAbastecimentos && veiculo.periodicidade && veiculo.quantidade) {
        const dataAtual = new Date();
        const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

        // Buscar abastecimentos no período (apenas os que têm data_abastecimento)
        const abastecimentos = await this.prisma.abastecimento.findMany({
          where: {
            veiculoId: veiculoId,
            ativo: true,
            data_abastecimento: {
              not: null,
              gte: inicio,
              lte: fim,
            },
          },
          select: {
            quantidade: true,
            data_abastecimento: true,
          },
        });

        // Somar quantidades
        const totalUtilizado = abastecimentos.reduce((sum, ab) => {
          return sum + Number(ab.quantidade || 0);
        }, 0);

        const limite = Number(veiculo.quantidade);
        const dentroDoLimite = totalUtilizado <= limite;
        const quantidadeDisponivel = Math.max(limite - totalUtilizado, 0);

        resposta.analise_periodo = {
          periodicidade: veiculo.periodicidade,
          limite: limite,
          total_utilizado: totalUtilizado,
          quantidade_disponivel: quantidadeDisponivel,
          dentro_do_limite: dentroDoLimite,
          ultrapassou_limite: !dentroDoLimite,
          periodo: {
            inicio: inicio.toISOString(),
            fim: fim.toISOString(),
          },
          abastecimentos_no_periodo: abastecimentos.length,
        };
      } else if (temAbastecimentos && (!veiculo.periodicidade || !veiculo.quantidade)) {
        resposta.analise_periodo = {
          mensagem: 'Veículo não possui periodicidade ou quantidade configurada',
          periodicidade: veiculo.periodicidade,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade) : null,
        };
      } else {
        resposta.analise_periodo = {
          mensagem: 'Nenhum abastecimento encontrado para este veículo',
          periodicidade: veiculo.periodicidade,
          limite: veiculo.quantidade ? Number(veiculo.quantidade) : null,
          total_utilizado: 0,
          quantidade_disponivel: veiculo.quantidade ? Number(veiculo.quantidade) : null,
          dentro_do_limite: true,
          ultrapassou_limite: false,
        };
      }
    }

    return resposta;
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

  /**
   * Busca o preço atual de um combustível pelo ID
   * Retorna o preço_atual do registro mais recente e ativo em EmpresaPrecoCombustivel
   */
  async obterPrecoCombustivelPorId(combustivelId: number) {
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

    // Buscar o preço ativo mais recente do combustível
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      select: {
        id: true,
        preco_atual: true,
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
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    if (!precoCombustivel) {
      throw new NotFoundException(
        `Preço ativo não encontrado para o combustível com ID ${combustivelId}`,
      );
    }

    return {
      message: 'Preço do combustível recuperado com sucesso',
      preco_atual: Number(precoCombustivel.preco_atual),
      combustivel: precoCombustivel.combustivel,
      empresa: precoCombustivel.empresa,
      updated_at: precoCombustivel.updated_at,
    };
  }

  /**
   * Garante que existe um período ativo para o veículo
   * Se o período atual expirou, cria um novo período resetado
   */
  private async garantirPeriodoAtivo(
    tx: Prisma.TransactionClient,
    veiculoId: number,
    periodicidade: Periodicidade,
    dataAtual: Date,
    quantidadePermitida: number,
  ): Promise<void> {
    // Buscar período ativo atual
    const periodoAtual = await tx.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId,
        periodicidade,
        data_inicio_periodo: { lte: dataAtual },
        data_fim_periodo: { gte: dataAtual },
        ativo: true,
      },
      orderBy: {
        data_inicio_periodo: 'desc',
      },
    });

    // Se não existe período ativo ou o período atual já expirou, criar novo
    if (!periodoAtual || periodoAtual.data_fim_periodo < dataAtual) {
      // Desativar períodos antigos se necessário
      if (periodoAtual) {
        await tx.veiculoCotaPeriodo.update({
          where: { id: periodoAtual.id },
          data: { ativo: false },
        });
      }

      // Calcular novo intervalo de período
      const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, periodicidade);

      // Criar novo período resetado
      await tx.veiculoCotaPeriodo.create({
        data: {
          veiculoId,
          data_inicio_periodo: inicio,
          data_fim_periodo: fim,
          quantidade_permitida: this.toDecimal(quantidadePermitida),
          quantidade_utilizada: 0,
          quantidade_disponivel: this.toDecimal(quantidadePermitida),
          periodicidade,
          ativo: true,
        },
      });
    }
  }

  /**
   * Atualiza VeiculoCotaPeriodo ao criar uma solicitação de abastecimento
   * Incrementa quantidade_utilizada e decrementa quantidade_disponivel
   */
  private async atualizarVeiculoCotaPeriodo(
    tx: Prisma.TransactionClient,
    veiculoId: number,
    periodicidade: Periodicidade,
    dataSolicitacao: Date,
    quantidade: number,
    quantidadePermitida: number,
  ): Promise<void> {
    // Garantir que existe um período ativo (criar novo se necessário)
    await this.garantirPeriodoAtivo(tx, veiculoId, periodicidade, dataSolicitacao, quantidadePermitida);

    // Buscar a cota de período ativa que contém a data da solicitação
    const cotaPeriodo = await tx.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId,
        periodicidade,
        data_inicio_periodo: { lte: dataSolicitacao },
        data_fim_periodo: { gte: dataSolicitacao },
        ativo: true,
      },
      orderBy: {
        data_inicio_periodo: 'desc',
      },
    });

    if (!cotaPeriodo) {
      throw new SolicitacaoAbastecimentoVeiculoCotaPeriodoNaoEncontradaException(
        veiculoId,
        periodicidade,
        dataSolicitacao,
      );
    }

    const quantidadeUtilizadaAtual = Number(cotaPeriodo.quantidade_utilizada.toString());
    const quantidadeDisponivelAtual = Number(cotaPeriodo.quantidade_disponivel.toString());
    const quantidadePermitidaAtual = Number(cotaPeriodo.quantidade_permitida.toString());

    // Calcular novos valores
    const novaQuantidadeUtilizada = quantidadeUtilizadaAtual + quantidade;
    const novaQuantidadeDisponivel = Math.max(quantidadeDisponivelAtual - quantidade, 0);

    // Atualizar VeiculoCotaPeriodo
    await tx.veiculoCotaPeriodo.update({
      where: { id: cotaPeriodo.id },
      data: {
        quantidade_utilizada: this.toDecimal(novaQuantidadeUtilizada),
        quantidade_disponivel: this.toDecimal(novaQuantidadeDisponivel),
      },
    });
  }

  /**
   * Libera litros de uma solicitação expirada específica
   * Quando uma solicitação expira, os litros devem voltar para a cota período
   * Busca o período que estava ativo quando a solicitação foi criada
   */
  private async liberarLitrosSolicitacaoExpirada(
    solicitacao: {
      id: number;
      veiculoId: number;
      quantidade: Decimal;
      data_solicitacao: Date;
      veiculo: {
        id: number;
        tipo_abastecimento: TipoAbastecimentoVeiculo;
        periodicidade: Periodicidade | null;
      };
    },
  ): Promise<void> {
    const veiculo = solicitacao.veiculo;

    // Apenas processar se for tipo COM_COTA (COTA no enum do veículo) e tiver periodicidade
    // TipoAbastecimentoVeiculo.COTA corresponde ao tipo COM_COTA mencionado na documentação
    if (
      veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA &&
      veiculo.periodicidade
    ) {
      await this.prisma.$transaction(async (tx) => {
        // Buscar a cota de período que estava ativa quando a solicitação foi criada
        // Usar a data_solicitacao para encontrar o período correto
        // Isso é importante porque o período pode ter mudado desde que a solicitação foi criada
        const dataSolicitacaoReal = this.getDateAdjustedToTimezone(solicitacao.data_solicitacao);

        const cotaPeriodo = await tx.veiculoCotaPeriodo.findFirst({
          where: {
            veiculoId: veiculo.id,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: { lte: dataSolicitacaoReal || solicitacao.data_solicitacao },
            data_fim_periodo: { gte: dataSolicitacaoReal || solicitacao.data_solicitacao },
            ativo: true,
          },
          orderBy: {
            data_inicio_periodo: 'desc',
          },
        });

        if (cotaPeriodo) {
          const quantidadeSolicitacao = Number(solicitacao.quantidade.toString());
          const quantidadeUtilizadaAtual = Number(cotaPeriodo.quantidade_utilizada.toString());
          const quantidadeDisponivelAtual = Number(cotaPeriodo.quantidade_disponivel.toString());
          const quantidadePermitida = Number(cotaPeriodo.quantidade_permitida.toString());

          // Liberar os litros: decrementar quantidade_utilizada e recalcular quantidade_disponivel
          // Regras:
          // - quantidade_utilizada: valores de 0 até quantidade_permitida (não pode ser negativo, não pode exceder quantidade_permitida)
          // - quantidade_disponivel: valores de quantidade_permitida até 0 (não pode ser negativo, não pode exceder quantidade_permitida)
          // - Relação: quantidade_utilizada + quantidade_disponivel = quantidade_permitida
          
          // Calcular nova quantidade_utilizada (subtrair a quantidade solicitada)
          // Garantir que fique entre 0 e quantidade_permitida
          const novaQuantidadeUtilizada = Math.max(0, Math.min(quantidadePermitida, quantidadeUtilizadaAtual - quantidadeSolicitacao));
          
          // Recalcular quantidade_disponivel baseado na fórmula:
          // quantidade_disponivel = quantidade_permitida - quantidade_utilizada
          // Garantir que fique entre 0 e quantidade_permitida
          const novaQuantidadeDisponivel = Math.max(0, Math.min(quantidadePermitida, quantidadePermitida - novaQuantidadeUtilizada));

          // Atualizar VeiculoCotaPeriodo
          await tx.veiculoCotaPeriodo.update({
            where: { id: cotaPeriodo.id },
            data: {
              quantidade_utilizada: this.toDecimal(novaQuantidadeUtilizada),
              quantidade_disponivel: this.toDecimal(novaQuantidadeDisponivel),
            },
          });
        }
      });
    }
  }

  /**
   * Reseta períodos expirados para veículos com tipo COTA
   * Cria novos períodos quando o período atual expira (diário, semanal, mensal)
   */
  async resetarPeriodosExpirados(): Promise<{ resetados: number }> {
    const dataAtual = new Date();

    // Buscar todos os veículos com tipo COTA e periodicidade configurada
    const veiculosComCota = await this.prisma.veiculo.findMany({
      where: {
        tipo_abastecimento: TipoAbastecimentoVeiculo.COTA,
        periodicidade: { not: null },
        quantidade: { not: null },
        ativo: true,
      },
      select: {
        id: true,
        periodicidade: true,
        quantidade: true,
      },
    });

    let resetados = 0;

    for (const veiculo of veiculosComCota) {
      if (!veiculo.periodicidade || !veiculo.quantidade) {
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // Verificar se existe período ativo
          const periodoAtual = await tx.veiculoCotaPeriodo.findFirst({
            where: {
              veiculoId: veiculo.id,
              periodicidade: veiculo.periodicidade,
              data_inicio_periodo: { lte: dataAtual },
              data_fim_periodo: { gte: dataAtual },
              ativo: true,
            },
            orderBy: {
              data_inicio_periodo: 'desc',
            },
          });

          // Se não existe período ativo ou o período atual já expirou, criar novo
          if (!periodoAtual || periodoAtual.data_fim_periodo < dataAtual) {
            // Desativar períodos antigos se necessário
            if (periodoAtual) {
              await tx.veiculoCotaPeriodo.update({
                where: { id: periodoAtual.id },
                data: { ativo: false },
              });
            }

            // Calcular novo intervalo de período
            const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

            const quantidadePermitida = Number(veiculo.quantidade.toString());

            // Criar novo período resetado
            await tx.veiculoCotaPeriodo.create({
              data: {
                veiculoId: veiculo.id,
                data_inicio_periodo: inicio,
                data_fim_periodo: fim,
                quantidade_permitida: this.toDecimal(quantidadePermitida),
                quantidade_utilizada: 0,
                quantidade_disponivel: this.toDecimal(quantidadePermitida),
                periodicidade: veiculo.periodicidade,
                ativo: true,
              },
            });

            resetados++;
          }
        });
      } catch (error) {
        console.error(`Erro ao resetar período para veículo ${veiculo.id}:`, error);
        // Continua processando os outros veículos mesmo se um falhar
      }
    }

    return { resetados };
  }

  private async expirarSolicitacaoSeNecessario(
    solicitacao: SolicitacaoBasicaComVeiculo,
  ): Promise<boolean> {
    if (!solicitacao?.data_expiracao) {
      return false;
    }

    const dataAtual = new Date();
    const dataAtualReal = this.getDateAdjustedToTimezone(dataAtual);
    const dataExpiracaoReal = this.getDateAdjustedToTimezone(solicitacao.data_expiracao);
    const precisaExpirar =
      dataExpiracaoReal &&
      dataAtualReal &&
      dataExpiracaoReal <= dataAtualReal &&
      (solicitacao.status === StatusSolicitacao.PENDENTE ||
        solicitacao.status === StatusSolicitacao.APROVADA);

    if (!precisaExpirar) {
      return false;
    }

    await this.prisma.solicitacaoAbastecimento.update({
      where: { id: solicitacao.id },
      data: {
        status: StatusSolicitacao.EXPIRADA,
        updated_at: dataAtual,
      },
    });

    if (
      solicitacao.veiculo &&
      solicitacao.veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA &&
      solicitacao.veiculo.periodicidade
    ) {
      const solicitacaoComVeiculoCota: SolicitacaoComVeiculoCota = {
        ...solicitacao,
        veiculo: {
          id: solicitacao.veiculo.id,
          tipo_abastecimento: solicitacao.veiculo.tipo_abastecimento,
          periodicidade: solicitacao.veiculo.periodicidade,
        },
      };
      await this.liberarLitrosSolicitacaoExpirada(solicitacaoComVeiculoCota);
    }

    solicitacao.status = StatusSolicitacao.EXPIRADA;
    return true;
  }

  private async expirarSolicitacoesDaLista(
    solicitacoes: SolicitacaoBasicaComVeiculo[],
  ): Promise<void> {
    await Promise.all(solicitacoes.map((solicitacao) => this.expirarSolicitacaoSeNecessario(solicitacao)));
  }

  /**
   * Processa todas as solicitações expiradas do sistema
   * Atualiza o status para EXPIRADA e libera os litros de volta para VeiculoCotaPeriodo
   */
  async processarSolicitacoesExpiradas(): Promise<{ processadas: number; liberadas: number }> {
    const dataAtual = new Date();
    const dataAtualReal = this.getDateAdjustedToTimezone(dataAtual);

    // Buscar todas as solicitações ativas com status PENDENTE ou APROVADA
    // Filtrar em código para considerar apenas as que têm data_expiracao e já expiraram
    const solicitacoesCandidatas = await this.prisma.solicitacaoAbastecimento.findMany({
      where: {
        status: {
          in: [StatusSolicitacao.PENDENTE, StatusSolicitacao.APROVADA],
        },
        ativo: true,
      },
      include: {
        veiculo: {
          select: {
            id: true,
            tipo_abastecimento: true,
            periodicidade: true,
          },
        },
      },
    });

    if (solicitacoesCandidatas.length === 0) {
      return { processadas: 0, liberadas: 0 };
    }

    // Filtrar apenas as que têm data_expiracao e já expiraram (considerando fuso horário)
    const solicitacoesExpiradas = solicitacoesCandidatas.filter((solicitacao) => {
      if (!solicitacao.data_expiracao) {
        return false;
      }
      const dataExpiracaoReal = this.getDateAdjustedToTimezone(solicitacao.data_expiracao);
      return dataExpiracaoReal && dataAtualReal && dataExpiracaoReal <= dataAtualReal;
    });

    if (solicitacoesExpiradas.length === 0) {
      return { processadas: 0, liberadas: 0 };
    }

    let processadas = 0;
    let liberadas = 0;

    // Processar cada solicitação expirada
    for (const solicitacao of solicitacoesExpiradas) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Atualizar status da solicitação para EXPIRADA
          await tx.solicitacaoAbastecimento.update({
            where: { id: solicitacao.id },
            data: {
              status: StatusSolicitacao.EXPIRADA,
              updated_at: new Date(),
            },
          });
        });

        processadas++;

        // Liberar litros da solicitação (se for tipo COTA)
        const veiculo = solicitacao.veiculo;
        if (
          veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA &&
          veiculo.periodicidade
        ) {
          const solicitacaoComVeiculoCota: SolicitacaoComVeiculoCota = {
            ...solicitacao,
            veiculo: {
              id: veiculo.id,
              tipo_abastecimento: veiculo.tipo_abastecimento,
              periodicidade: veiculo.periodicidade,
            },
          };
          await this.liberarLitrosSolicitacaoExpirada(solicitacaoComVeiculoCota);
          liberadas++;
        }
      } catch (error) {
        console.error(`Erro ao processar solicitação expirada ${solicitacao.id}:`, error);
        // Continua processando as outras solicitações mesmo se uma falhar
      }
    }

    return {
      processadas,
      liberadas,
    };
  }

  /**
   * Libera litros de solicitações expiradas para um veículo
   * Quando uma solicitação expira, os litros devem voltar para a cota período
   */
  private async liberarLitrosSolicitacoesExpiradas(veiculoId: number): Promise<void> {
    const dataAtual = new Date();
    const dataAtualReal = this.getDateAdjustedToTimezone(dataAtual);

    // Buscar solicitações candidatas (com status PENDENTE ou APROVADA e ativas)
    // Filtrar em código para considerar apenas as que têm data_expiracao e já expiraram
    const solicitacoesCandidatas = await this.prisma.solicitacaoAbastecimento.findMany({
      where: {
        veiculoId,
        status: {
          in: [StatusSolicitacao.PENDENTE, StatusSolicitacao.APROVADA],
        },
        ativo: true,
      },
      include: {
        veiculo: {
          select: {
            id: true,
            tipo_abastecimento: true,
            periodicidade: true,
          },
        },
      },
    });

    if (solicitacoesCandidatas.length === 0) {
      return;
    }

    // Filtrar apenas as que têm data_expiracao e já expiraram (considerando fuso horário)
    const solicitacoesExpiradas = solicitacoesCandidatas.filter((solicitacao) => {
      if (!solicitacao.data_expiracao) {
        return false;
      }
      const dataExpiracaoReal = this.getDateAdjustedToTimezone(solicitacao.data_expiracao);
      return dataExpiracaoReal && dataAtualReal && dataExpiracaoReal <= dataAtualReal;
    });

    if (solicitacoesExpiradas.length === 0) {
      return;
    }

    // Processar cada solicitação expirada
    for (const solicitacao of solicitacoesExpiradas) {

      await this.prisma.$transaction(async (tx) => {
        // Atualizar status da solicitação para EXPIRADA
        await tx.solicitacaoAbastecimento.update({
          where: { id: solicitacao.id },
          data: {
            status: StatusSolicitacao.EXPIRADA,
            updated_at: new Date(),
          },
        });
      });

      // Liberar litros da solicitação
      const solicitacaoComVeiculoCota: SolicitacaoComVeiculoCota = {
        ...solicitacao,
        veiculo: {
          id: solicitacao.veiculo.id,
          tipo_abastecimento: solicitacao.veiculo.tipo_abastecimento,
          periodicidade: solicitacao.veiculo.periodicidade,
        },
      };
      await this.liberarLitrosSolicitacaoExpirada(solicitacaoComVeiculoCota);
    }
  }

  /**
   * Valida se a quantidade é menor ou igual à capacidade do tanque do veículo
   * Retorna mensagem positiva se válido, ou mensagem informando que não é possível se exceder
   */
  async validarCapacidadeTanque(veiculoId: number, quantidade: number) {
    // Buscar o veículo pelo ID
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      select: {
        id: true,
        nome: true,
        placa: true,
        capacidade_tanque: true,
      },
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${veiculoId} não encontrado`);
    }

    const capacidadeTanque = Number(veiculo.capacidade_tanque);
    const quantidadeNum = Number(quantidade);

    // Comparar quantidade com capacidade do tanque
    if (quantidadeNum <= capacidadeTanque) {
      return {
        message: 'A quantidade informada é válida e não excede a capacidade do tanque do veículo',
        valido: true,
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          capacidade_tanque: capacidadeTanque,
        },
        quantidade: quantidadeNum,
      };
    } else {
      return {
        message: 'Não é possível abastecer esta quantidade. A quantidade informada excede a capacidade do tanque do veículo',
        valido: false,
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          capacidade_tanque: capacidadeTanque,
        },
        quantidade: quantidadeNum,
      };
    }
  }

  private normalizeDateInput(value?: string | Date | null): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    const trimmed = value.toString().trim();
    if (!trimmed) {
      return undefined;
    }

    const isoWithTimezone = this.timezoneSuffixRegex.test(trimmed)
      ? trimmed
      : `${trimmed}${this.defaultTimezoneOffset}`;

    const parsed = new Date(isoWithTimezone);
    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  private ensureDate(value: Date | undefined, fieldName: string): Date {
    if (!value) {
      throw new BadRequestException(`Campo ${fieldName} possui data inválida ou não foi informado`);
    }

    return value;
  }

  /**
   * Ajusta uma data para o fuso horário configurado (America/Fortaleza -03:00)
   * Considerando que o banco armazena em UTC, mas a regra de negócio é no horário local
   */
  private getDateAdjustedToTimezone(value?: Date | null): Date | null {
    if (!value) {
      return null;
    }

    const d = new Date(value);
    // Diferencial entre o fuso da máquina e o fuso desejado (em minutos)
    const offsetDiffMinutes = d.getTimezoneOffset() - this.timezoneOffsetMinutes;
    d.setMinutes(d.getMinutes() + offsetDiffMinutes);
    return d;
  }

  private formatDateWithTimezone(value?: Date | null): string | null {
    if (!value) {
      return null;
    }

    // Quando o Prisma retorna uma data do banco, ela vem em UTC
    // Se salvamos "13:04" em Fortaleza (-03:00), o banco salva como "10:04 UTC"
    // Para mostrar "13:04 -03:00", precisamos ADICIONAR 3 horas (180 minutos)
    // timezoneOffsetMinutes = -180, então precisamos fazer: value.getTime() - (-180) * 60 * 1000
    // que é equivalente a: value.getTime() + 180 * 60 * 1000
    const offsetMs = -this.timezoneOffsetMinutes * 60 * 1000; // Converte -180 para +180 minutos em ms
    const localTime = new Date(value.getTime() + offsetMs);
    const iso = localTime.toISOString().replace('Z', this.defaultTimezoneOffset);
    return iso;
  }

  /**
   * Retorna a data exatamente como está no banco de dados, sem conversão de timezone
   * O Prisma retorna datas como objetos Date em UTC, que representam o valor exato do banco
   * Usamos toISOString() que retorna o valor UTC sem nenhuma conversão adicional
   */
  private formatDateAsStored(value?: Date | null): string | null {
    if (!value) {
      return null;
    }
    // Retorna a data exatamente como está armazenada no banco (em UTC)
    // toISOString() retorna o valor UTC do objeto Date sem conversão
    return value.toISOString();
  }

  private formatSolicitacaoResponse<
    T extends { data_solicitacao?: Date | null; data_expiracao?: Date | null; data_aprovacao?: Date | null; data_rejeicao?: Date | null },
  >(registro: T): T {
    if (!registro) {
      return registro;
    }

    const formatted: any = { ...registro };
    // Retorna as datas exatamente como estão no banco, sem conversão de timezone
    formatted.data_solicitacao = this.formatDateAsStored(registro.data_solicitacao);
    formatted.data_expiracao = this.formatDateAsStored(registro.data_expiracao);
    formatted.data_aprovacao = this.formatDateAsStored(registro.data_aprovacao);
    formatted.data_rejeicao = this.formatDateAsStored(registro.data_rejeicao);

    return formatted;
  }
}

