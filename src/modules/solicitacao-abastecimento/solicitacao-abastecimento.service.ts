import { Injectable, NotFoundException } from '@nestjs/common';
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

      const novaSolicitacao = await tx.solicitacaoAbastecimento.create({
        data,
        include: this.solicitacaoInclude,
      });

      // Se o veículo for do tipo COM_COTA, atualizar VeiculoCotaPeriodo
      if (veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA && veiculo.periodicidade) {
        await this.atualizarVeiculoCotaPeriodo(
          tx,
          veiculo.id,
          veiculo.periodicidade,
          dataSolicitacao,
          createDto.quantidade,
        );
      }

      return novaSolicitacao;
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

    const response: any = {
      message: 'Solicitações de abastecimento encontradas com sucesso',
      solicitacoes,
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

    return {
      message: `Status da solicitação alterado para ${updateStatusDto.status}`,
      solicitacao: solicitacaoAtualizada,
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
   * Atualiza VeiculoCotaPeriodo ao criar uma solicitação de abastecimento
   * Incrementa quantidade_utilizada e decrementa quantidade_disponivel
   */
  private async atualizarVeiculoCotaPeriodo(
    tx: Prisma.TransactionClient,
    veiculoId: number,
    periodicidade: Periodicidade,
    dataSolicitacao: Date,
    quantidade: number,
  ): Promise<void> {
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
    const quantidadePermitida = Number(cotaPeriodo.quantidade_permitida.toString());

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

    // Apenas processar se for tipo COM_COTA e tiver periodicidade
    if (
      veiculo.tipo_abastecimento === TipoAbastecimentoVeiculo.COTA &&
      veiculo.periodicidade
    ) {
      await this.prisma.$transaction(async (tx) => {
        // Buscar a cota de período que estava ativa quando a solicitação foi criada
        // Usar a data_solicitacao para encontrar o período correto
        const cotaPeriodo = await tx.veiculoCotaPeriodo.findFirst({
          where: {
            veiculoId: veiculo.id,
            periodicidade: veiculo.periodicidade,
            data_inicio_periodo: { lte: solicitacao.data_solicitacao },
            data_fim_periodo: { gte: solicitacao.data_solicitacao },
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

          // Liberar os litros: decrementar quantidade_utilizada e incrementar quantidade_disponivel
          const novaQuantidadeUtilizada = Math.max(quantidadeUtilizadaAtual - quantidadeSolicitacao, 0);
          const novaQuantidadeDisponivel = Math.min(
            quantidadeDisponivelAtual + quantidadeSolicitacao,
            quantidadePermitida,
          );

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
   * Libera litros de solicitações expiradas para um veículo
   * Quando uma solicitação expira, os litros devem voltar para a cota período
   */
  private async liberarLitrosSolicitacoesExpiradas(veiculoId: number): Promise<void> {
    const dataAtual = new Date();

    // Buscar solicitações expiradas que ainda não foram processadas
    // Status deve ser PENDENTE ou APROVADA (não EFETIVADA, REJEITADA ou CANCELADA)
    const solicitacoesExpiradas = await this.prisma.solicitacaoAbastecimento.findMany({
      where: {
        veiculoId,
        data_expiracao: { lt: dataAtual },
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
      await this.liberarLitrosSolicitacaoExpirada(solicitacao);
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
}

