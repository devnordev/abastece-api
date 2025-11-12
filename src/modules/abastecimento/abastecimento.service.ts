import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { Prisma, StatusAbastecimento, StatusSolicitacao, TipoAbastecimento, Periodicidade, TipoAbastecimentoVeiculo } from '@prisma/client';
import {
  AbastecimentoNotFoundException,
  AbastecimentoVeiculoNotFoundException,
  AbastecimentoCombustivelNotFoundException,
  AbastecimentoEmpresaNotFoundException,
  AbastecimentoMotoristaNotFoundException,
  AbastecimentoValidadorNotFoundException,
  AbastecimentoAbastecedorNotFoundException,
  AbastecimentoContaFaturamentoNotFoundException,
  AbastecimentoCotaNotFoundException,
  AbastecimentoSolicitacaoNotFoundException,
  AbastecimentoUsuarioSemEmpresaException,
  AbastecimentoEmpresaDiferenteException,
  AbastecimentoEmpresaInativaException,
  AbastecimentoSolicitacaoExpiradaException,
  AbastecimentoSolicitacaoRejeitadaException,
  AbastecimentoSolicitacaoEfetivadaException,
  AbastecimentoSolicitacaoInativaException,
  AbastecimentoSolicitacaoEmpresaDiferenteException,
  AbastecimentoSolicitacaoJaPossuiAbastecimentoException,
  AbastecimentoJaAprovadoException,
  AbastecimentoJaRejeitadoException,
  AbastecimentoNaoAguardandoAprovacaoException,
  AbastecimentoMotivoRejeicaoObrigatorioException,
  AbastecimentoQuantidadeInvalidaException,
  AbastecimentoValorTotalInvalidoException,
  AbastecimentoDataAbastecimentoFuturaException,
  AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException,
  AbastecimentoNFEChaveAcessoInvalidaException,
  AbastecimentoNFEUrlInvalidaException,
  AbastecimentoDescontoMaiorQueValorException,
  AbastecimentoVeiculoInativoException,
  AbastecimentoCombustivelInativoException,
  AbastecimentoCotaInativaException,
  AbastecimentoMotoristaNaoPertencePrefeituraException,
  AbastecimentoValorTotalInconsistenteException,
  AbastecimentoCombustivelNaoVinculadoVeiculoException,
  AbastecimentoCanceladoException,
  AbastecimentoInativoException,
} from '../../common/exceptions';

@Injectable()
export class AbastecimentoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atualiza a cota do órgão após um abastecimento
   * Incrementa quantidade_utilizada e valor_utilizado
   * Recalcula restante e saldo_disponivel_cota
   */
  private async atualizarCotaOrgao(
    tx: Prisma.TransactionClient,
    cotaId: number,
    quantidade: number,
    valorTotal: number,
  ): Promise<void> {
    // Buscar cota atual dentro da transação
    const cota = await tx.cotaOrgao.findUnique({
      where: { id: cotaId },
      select: {
        id: true,
        quantidade: true,
        quantidade_utilizada: true,
        valor_utilizado: true,
      },
    });

    if (!cota) {
      throw new AbastecimentoCotaNotFoundException(cotaId, {
        additionalInfo: {
          cotaId,
          message: 'Cota não encontrada ao tentar atualizar após abastecimento',
        },
      });
    }

    // Calcular novos valores
    const quantidadeUtilizadaAtual = Number(cota.quantidade_utilizada?.toString() || '0');
    const valorUtilizadoAtual = Number(cota.valor_utilizado?.toString() || '0');
    const quantidadeTotal = Number(cota.quantidade.toString());

    const novaQuantidadeUtilizada = quantidadeUtilizadaAtual + quantidade;
    const novoValorUtilizado = valorUtilizadoAtual + valorTotal;
    const restante = quantidadeTotal - novaQuantidadeUtilizada;
    const saldoDisponivelCota = quantidadeTotal - novaQuantidadeUtilizada;

    // Atualizar cota
    await tx.cotaOrgao.update({
      where: { id: cotaId },
      data: {
        quantidade_utilizada: new Prisma.Decimal(novaQuantidadeUtilizada),
        valor_utilizado: new Prisma.Decimal(novoValorUtilizado),
        restante: new Prisma.Decimal(Math.max(0, restante)),
        saldo_disponivel_cota: new Prisma.Decimal(Math.max(0, saldoDisponivelCota)),
      },
    });
  }

  async create(createAbastecimentoDto: CreateAbastecimentoDto, user: any) {
    const { veiculoId, combustivelId, empresaId, motoristaId, validadorId, abastecedorId, conta_faturamento_orgao_id, cota_id } = createAbastecimentoDto;

    // Verificar se o usuário pertence à empresa informada (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new AbastecimentoUsuarioSemEmpresaException({
        user: { id: user?.id, tipo: user?.tipo_usuario, email: user?.email },
        payload: createAbastecimentoDto,
      });
    }

    if (user.empresa.id !== empresaId) {
      throw new AbastecimentoEmpresaDiferenteException(empresaId, user.empresa.id, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se veículo existe
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: {
        orgao: {
          select: {
            id: true,
            prefeituraId: true,
          },
        },
      },
    });

    if (!veiculo) {
      throw new AbastecimentoVeiculoNotFoundException(veiculoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se veículo está ativo
    if (!veiculo.ativo) {
      throw new AbastecimentoVeiculoInativoException(veiculoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível existe
    const combustivel = await this.prisma.combustivel.findUnique({
      where: { id: combustivelId },
    });

    if (!combustivel) {
      throw new AbastecimentoCombustivelNotFoundException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível está ativo
    if (!combustivel.ativo) {
      throw new AbastecimentoCombustivelInativoException(combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se combustível está vinculado ao veículo
    const combustivelVinculado = await this.prisma.veiculoCombustivel.findFirst({
      where: {
        veiculoId: veiculoId,
        combustivelId: combustivelId,
        ativo: true,
      },
    });

    if (!combustivelVinculado) {
      throw new AbastecimentoCombustivelNaoVinculadoVeiculoException(veiculoId, combustivelId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se empresa existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new AbastecimentoEmpresaNotFoundException(empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se a empresa está ativa
    if (!empresa.ativo) {
      throw new AbastecimentoEmpresaInativaException(empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Verificar se motorista existe (se informado)
    if (motoristaId) {
      const motorista = await this.prisma.motorista.findUnique({
        where: { id: motoristaId },
        include: {
          prefeitura: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!motorista) {
        throw new AbastecimentoMotoristaNotFoundException(motoristaId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }

      // Verificar se motorista pertence à mesma prefeitura do veículo
      if (veiculo.orgao?.prefeituraId && motorista.prefeituraId !== veiculo.orgao.prefeituraId) {
        throw new AbastecimentoMotoristaNaoPertencePrefeituraException(motoristaId, veiculoId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se validador existe (se informado)
    if (validadorId) {
      const validador = await this.prisma.usuario.findUnique({
        where: { id: validadorId },
      });
      if (!validador) {
        throw new AbastecimentoValidadorNotFoundException(validadorId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se abastecedor existe (se informado)
    if (abastecedorId) {
      const abastecedor = await this.prisma.empresa.findUnique({
        where: { id: abastecedorId },
      });
      if (!abastecedor) {
        throw new AbastecimentoAbastecedorNotFoundException(abastecedorId, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se conta de faturamento existe (se informado)
    if (conta_faturamento_orgao_id) {
      const contaFaturamento = await this.prisma.contaFaturamentoOrgao.findUnique({
        where: { id: conta_faturamento_orgao_id },
      });
      if (!contaFaturamento) {
        throw new AbastecimentoContaFaturamentoNotFoundException(conta_faturamento_orgao_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Verificar se cota existe (se informado)
    if (cota_id) {
      const cota = await this.prisma.cotaOrgao.findUnique({
        where: { id: cota_id },
      });
      if (!cota) {
        throw new AbastecimentoCotaNotFoundException(cota_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }

      // Verificar se cota está ativa
      if (!cota.ativa) {
        throw new AbastecimentoCotaInativaException(cota_id, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Validações de campos
    const { quantidade, valor_total, data_abastecimento, nfe_chave_acesso, nfe_img_url, nfe_link, desconto, preco_empresa } = createAbastecimentoDto;

    // Validar quantidade
    if (!quantidade || quantidade <= 0) {
      throw new AbastecimentoQuantidadeInvalidaException(quantidade || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar valor total
    if (!valor_total || valor_total < 0) {
      throw new AbastecimentoValorTotalInvalidoException(valor_total || 0, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar data de abastecimento (não pode ser futura)
    if (data_abastecimento) {
      const dataAbastecimento = new Date(data_abastecimento);
      const dataAtual = new Date();
      if (dataAbastecimento > dataAtual) {
        throw new AbastecimentoDataAbastecimentoFuturaException(dataAbastecimento, {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        });
      }
    }

    // Validar quantidade vs capacidade do tanque
    if (veiculo.capacidade_tanque && quantidade > Number(veiculo.capacidade_tanque)) {
      throw new AbastecimentoQuantidadeMaiorQueCapacidadeTanqueException(
        quantidade,
        Number(veiculo.capacidade_tanque),
        veiculoId,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createAbastecimentoDto,
        }
      );
    }

    // Validar chave de acesso NFE (deve ter 44 caracteres se informada)
    if (nfe_chave_acesso && (nfe_chave_acesso.length !== 44 || !/^\d+$/.test(nfe_chave_acesso))) {
      throw new AbastecimentoNFEChaveAcessoInvalidaException(nfe_chave_acesso, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar URLs da NFE
    if (nfe_img_url && !nfe_img_url.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_img_url', nfe_img_url, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    if (nfe_link && !nfe_link.match(/^https?:\/\/.+/)) {
      throw new AbastecimentoNFEUrlInvalidaException('nfe_link', nfe_link, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar desconto (não pode ser maior que valor total)
    const descontoValor = desconto || 0;
    if (descontoValor > valor_total) {
      throw new AbastecimentoDescontoMaiorQueValorException(descontoValor, valor_total, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createAbastecimentoDto,
      });
    }

    // Validar consistência do valor total (se preco_empresa e quantidade estiverem informados)
    if (preco_empresa && quantidade) {
      const valorCalculado = quantidade * preco_empresa - descontoValor;
      // Permitir pequena diferença devido a arredondamentos (0.01)
      if (Math.abs(valor_total - valorCalculado) > 0.01) {
        throw new AbastecimentoValorTotalInconsistenteException(
          valor_total,
          quantidade,
          preco_empresa,
          descontoValor,
          {
            user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
            payload: createAbastecimentoDto,
          }
        );
      }
    }

    // Criar abastecimento e atualizar cota em transação
    const abastecimento = await this.prisma.$transaction(async (tx) => {
      // Criar abastecimento
      const abastecimentoCriado = await tx.abastecimento.create({
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
          cota: {
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          },
        },
      });

      // Atualizar cota se informada
      if (cota_id) {
        await this.atualizarCotaOrgao(tx, cota_id, quantidade, valor_total);
        
        // Buscar cota atualizada para incluir no resultado
        const cotaAtualizada = await tx.cotaOrgao.findUnique({
          where: { id: cota_id },
          select: {
            id: true,
            quantidade: true,
            quantidade_utilizada: true,
            valor_utilizado: true,
            restante: true,
            saldo_disponivel_cota: true,
          },
        });
        
        // Atualizar cota no objeto retornado
        if (cotaAtualizada) {
          abastecimentoCriado.cota = cotaAtualizada;
        }
      }

      return abastecimentoCriado;
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
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
      });
    }

    return {
      message: 'Abastecimento encontrado com sucesso',
      abastecimento,
    };
  }

  async update(id: number, updateAbastecimentoDto: UpdateAbastecimentoDto, user?: any) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
    }

    // Verificar se abastecimento está cancelado
    if (existingAbastecimento.status === StatusAbastecimento.Cancelado) {
      throw new AbastecimentoCanceladoException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
    }

    // Verificar se abastecimento está inativo
    if (!existingAbastecimento.ativo) {
      throw new AbastecimentoInativoException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
        payload: updateAbastecimentoDto,
      });
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

  async remove(id: number, user?: any) {
    // Verificar se abastecimento existe
    const existingAbastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!existingAbastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : undefined,
      });
    }

    // Excluir abastecimento
    await this.prisma.abastecimento.delete({
      where: { id },
    });

    return {
      message: 'Abastecimento excluído com sucesso',
    };
  }

  async createFromSolicitacao(createDto: CreateAbastecimentoFromSolicitacaoDto, user: any) {
    const { solicitacaoId, data_abastecimento, status, odometro, orimetro, validadorId, abastecedorId, desconto, preco_anp, abastecido_por, nfe_link, ativo } = createDto;

    // Verificar se o usuário pertence a uma empresa (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new AbastecimentoUsuarioSemEmpresaException({
        user: { id: user?.id, tipo: user?.tipo_usuario, email: user?.email },
        payload: createDto,
      });
    }

    // Buscar a solicitação
    const solicitacao = await this.prisma.solicitacaoAbastecimento.findUnique({
      where: { id: solicitacaoId },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            orgaoId: true,
            orgao: {
              select: {
                id: true,
                nome: true,
              },
            },
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
            ativo: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new AbastecimentoSolicitacaoNotFoundException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a empresa da solicitação corresponde à empresa do usuário
    if (solicitacao.empresaId !== user.empresa.id) {
      throw new AbastecimentoSolicitacaoEmpresaDiferenteException(
        solicitacaoId,
        solicitacao.empresaId,
        user.empresa.id,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Verificar se a empresa da solicitação está ativa
    if (!solicitacao.empresa.ativo) {
      throw new AbastecimentoEmpresaInativaException(solicitacao.empresaId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação já tem um abastecimento vinculado
    if (solicitacao.abastecimento_id) {
      throw new AbastecimentoSolicitacaoJaPossuiAbastecimentoException(
        solicitacaoId,
        solicitacao.abastecimento_id,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Verificar se a solicitação está ativa
    if (!solicitacao.ativo) {
      throw new AbastecimentoSolicitacaoInativaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação não está expirada ou rejeitada
    if (solicitacao.status === StatusSolicitacao.EXPIRADA) {
      throw new AbastecimentoSolicitacaoExpiradaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    if (solicitacao.status === StatusSolicitacao.REJEITADA) {
      throw new AbastecimentoSolicitacaoRejeitadaException(solicitacaoId, {
        user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
        payload: createDto,
      });
    }

    // Verificar se a solicitação não está já efetivada
    if (solicitacao.status === StatusSolicitacao.EFETIVADA) {
      throw new AbastecimentoSolicitacaoEfetivadaException(
        solicitacaoId,
        solicitacao.abastecimento_id || 0,
        {
          user: { id: user.id, tipo: user.tipo_usuario, email: user.email },
          payload: createDto,
        }
      );
    }

    // Se a solicitação estiver PENDENTE, será aprovada automaticamente antes de criar o abastecimento
    // Fluxo: PENDENTE → APROVADA → Criar Abastecimento → EFETIVADA
    const precisaAprovar = solicitacao.status === StatusSolicitacao.PENDENTE;

    // Mapear tipo de abastecimento
    const tipoAbastecimento: TipoAbastecimento = solicitacao.tipo_abastecimento as TipoAbastecimento;

    // Mapear status do abastecimento
    // Se não informado, usar Aprovado (pois a solicitação será aprovada/efetivada)
    let statusAbastecimento: StatusAbastecimento = status || StatusAbastecimento.Aprovado;

    // Calcular valor total se não informado
    const valorTotal = solicitacao.valor_total 
      ? Number(solicitacao.valor_total) 
      : solicitacao.preco_empresa 
        ? Number(solicitacao.preco_empresa) * Number(solicitacao.quantidade) 
        : 0;

    // Buscar cota do órgão se necessário (para tipo COM_COTA)
    let cotaId: number | undefined = undefined;
    if (tipoAbastecimento === TipoAbastecimento.COM_COTA && solicitacao.veiculo.orgaoId) {
      // Buscar cota ativa para o órgão e combustível
      const cota = await this.prisma.cotaOrgao.findFirst({
        where: {
          orgaoId: solicitacao.veiculo.orgaoId,
          combustivelId: solicitacao.combustivelId,
          ativa: true,
        },
        orderBy: { id: 'desc' },
      });
      if (cota) {
        cotaId = cota.id;
      }
    }

    // Criar abastecimento
    const abastecimentoData: Prisma.AbastecimentoCreateInput = {
      veiculo: {
        connect: { id: solicitacao.veiculoId },
      },
      combustivel: {
        connect: { id: solicitacao.combustivelId },
      },
      empresa: {
        connect: { id: solicitacao.empresaId },
      },
      tipo_abastecimento: tipoAbastecimento,
      quantidade: new Prisma.Decimal(solicitacao.quantidade),
      valor_total: new Prisma.Decimal(valorTotal),
      data_abastecimento: data_abastecimento ? new Date(data_abastecimento) : new Date(),
      status: statusAbastecimento,
      ativo: ativo !== undefined ? ativo : true,
      nfe_chave_acesso: solicitacao.nfe_chave_acesso || undefined,
      nfe_img_url: solicitacao.nfe_img_url || undefined,
      nfe_link: nfe_link || undefined,
      abastecido_por: abastecido_por || solicitacao.abastecido_por || 'Sistema',
      preco_empresa: solicitacao.preco_empresa ? new Prisma.Decimal(solicitacao.preco_empresa) : undefined,
      preco_anp: preco_anp ? new Prisma.Decimal(preco_anp) : undefined,
      desconto: desconto ? new Prisma.Decimal(desconto) : undefined,
      odometro: odometro || undefined,
      orimetro: orimetro || undefined,
      contaFaturamento: solicitacao.conta_faturamento_orgao_id
        ? {
            connect: { id: solicitacao.conta_faturamento_orgao_id },
          }
        : undefined,
      cota: cotaId
        ? {
            connect: { id: cotaId },
          }
        : undefined,
    };

    // Adicionar relacionamentos opcionais
    if (solicitacao.motoristaId) {
      abastecimentoData.motorista = {
        connect: { id: solicitacao.motoristaId },
      };
    }

    // Adicionar validador se fornecido
    if (validadorId) {
      abastecimentoData.validador = {
        connect: { id: validadorId },
      };
    } else if (user?.id) {
      // Se não houver validadorId explícito, usar user.id como validador
      abastecimentoData.validador = {
        connect: { id: user.id },
      };
    }

    if (abastecedorId) {
      abastecimentoData.abastecedor = {
        connect: { id: abastecedorId },
      };
    }

    // Processar solicitação e criar abastecimento em transação
    // Fluxo: PENDENTE → APROVADA → Criar Abastecimento → EFETIVADA
    const resultado = await this.prisma.$transaction(async (tx) => {
      // PASSO 1: Se a solicitação estiver PENDENTE, alterar status para APROVADA
      if (precisaAprovar) {
        await tx.solicitacaoAbastecimento.update({
          where: { id: solicitacaoId },
          data: {
            status: StatusSolicitacao.APROVADA,
            data_aprovacao: new Date(),
            aprovado_por: user.nome || user.email || 'Sistema',
            aprovado_por_email: user.email || null,
            aprovado_por_empresa: user.empresa?.nome || null,
            updated_at: new Date(),
          },
        });
      }

      // PASSO 2: Criar registro na tabela de abastecimento com os dados da solicitação
      const abastecimento = await tx.abastecimento.create({
        data: abastecimentoData,
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
          cota: {
            select: {
              id: true,
              quantidade: true,
              quantidade_utilizada: true,
              valor_utilizado: true,
              restante: true,
              saldo_disponivel_cota: true,
            },
          },
        },
      });

      // PASSO 3: Alterar status da solicitação de APROVADA para EFETIVADA
      const solicitacaoAtualizada = await tx.solicitacaoAbastecimento.update({
        where: { id: solicitacaoId },
        data: {
          abastecimento_id: abastecimento.id,
          status: StatusSolicitacao.EFETIVADA,
          updated_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          abastecimento_id: true,
          data_solicitacao: true,
          data_expiracao: true,
          data_aprovacao: true,
          quantidade: true,
          tipo_abastecimento: true,
          aprovado_por: true,
          aprovado_por_email: true,
          aprovado_por_empresa: true,
        },
      });

      // PASSO 4: Atualizar cota se necessário
      if (cotaId && tipoAbastecimento === TipoAbastecimento.COM_COTA) {
        const quantidadeAbastecimento = Number(solicitacao.quantidade.toString());
        await this.atualizarCotaOrgao(tx, cotaId, quantidadeAbastecimento, valorTotal);
        
        // Buscar cota atualizada para incluir no resultado
        const cotaAtualizada = await tx.cotaOrgao.findUnique({
          where: { id: cotaId },
          select: {
            id: true,
            quantidade: true,
            quantidade_utilizada: true,
            valor_utilizado: true,
            restante: true,
            saldo_disponivel_cota: true,
          },
        });
        
        // Atualizar cota no objeto retornado
        if (cotaAtualizada) {
          abastecimento.cota = cotaAtualizada;
        }
      }

      return {
        abastecimento,
        solicitacao: solicitacaoAtualizada,
      };
    });

    return {
      message: precisaAprovar 
        ? 'Solicitação aprovada e abastecimento criado com sucesso'
        : 'Abastecimento criado a partir da solicitação com sucesso',
      abastecimento: resultado.abastecimento,
      solicitacao: resultado.solicitacao,
      aprovada_automaticamente: precisaAprovar,
    };
  }

  async approve(id: number, userId: number, userEmail: string, user?: any) {
    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Aprovado) {
      throw new AbastecimentoJaAprovadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Rejeitado) {
      throw new AbastecimentoJaRejeitadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status !== StatusAbastecimento.Aguardando) {
      throw new AbastecimentoNaoAguardandoAprovacaoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: StatusAbastecimento.Aprovado,
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

  async reject(id: number, userId: number, userEmail: string, motivo: string, user?: any) {
    if (!motivo || motivo.trim().length === 0) {
      throw new AbastecimentoMotivoRejeicaoObrigatorioException({
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
        payload: { motivo },
      });
    }

    const abastecimento = await this.prisma.abastecimento.findUnique({
      where: { id },
    });

    if (!abastecimento) {
      throw new AbastecimentoNotFoundException(id, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Aprovado) {
      throw new AbastecimentoJaAprovadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status === StatusAbastecimento.Rejeitado) {
      throw new AbastecimentoJaRejeitadoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    if (abastecimento.status !== StatusAbastecimento.Aguardando) {
      throw new AbastecimentoNaoAguardandoAprovacaoException(id, abastecimento.status, {
        resourceId: id,
        user: user ? { id: user.id, tipo: user.tipo_usuario, email: user.email } : { id: userId, email: userEmail },
      });
    }

    const updatedAbastecimento = await this.prisma.abastecimento.update({
      where: { id },
      data: {
        status: StatusAbastecimento.Rejeitado,
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

  /**
   * Verifica se a quantidade de litros informada excede a cota do veículo
   * Retorna informações sobre o consumo no período (diário, semanal ou mensal)
   */
  async verificarTipoAbastecimentoVeiculo(veiculoId: number, qntLitros: number) {
    // Buscar veículo com suas configurações
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      select: {
        id: true,
        nome: true,
        placa: true,
        tipo_abastecimento: true,
        periodicidade: true,
        quantidade: true,
      },
    });

    if (!veiculo) {
      throw new AbastecimentoVeiculoNotFoundException(veiculoId, {
        resourceId: veiculoId,
        additionalInfo: {
          veiculoId,
          qntLitros,
        },
      });
    }

    // Verificar se o veículo tem tipo de abastecimento com cota
    if (veiculo.tipo_abastecimento !== TipoAbastecimentoVeiculo.COTA) {
      return {
        message: 'Veículo não possui controle de cota',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          tipo_abastecimento: veiculo.tipo_abastecimento,
        },
        possuiCota: false,
        quantidadeSolicitada: qntLitros,
      };
    }

    // Verificar se tem periodicidade e quantidade configuradas
    if (!veiculo.periodicidade || !veiculo.quantidade) {
      return {
        message: 'Veículo possui controle de cota, mas não possui periodicidade ou quantidade configurada',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
          tipo_abastecimento: veiculo.tipo_abastecimento,
          periodicidade: veiculo.periodicidade,
          quantidade: veiculo.quantidade ? Number(veiculo.quantidade.toString()) : null,
        },
        possuiCota: true,
        configuracaoIncompleta: true,
        quantidadeSolicitada: qntLitros,
      };
    }

    // Calcular intervalo de período baseado na periodicidade
    const dataAtual = new Date();
    const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, veiculo.periodicidade);

    // Buscar abastecimentos do veículo no período
    const abastecimentosPeriodo = await this.prisma.abastecimento.aggregate({
      _sum: {
        quantidade: true,
      },
      where: {
        veiculoId: veiculoId,
        data_abastecimento: {
          gte: inicio,
          lte: fim,
        },
        ativo: true,
        // Considerar apenas abastecimentos aprovados ou efetivados
        status: {
          in: [StatusAbastecimento.Aprovado, StatusAbastecimento.Efetivado],
        },
      },
    });

    const quantidadeUtilizada = abastecimentosPeriodo._sum.quantidade
      ? Number(abastecimentosPeriodo._sum.quantidade.toString())
      : 0;

    const quantidadeLimite = Number(veiculo.quantidade.toString());
    const novaQuantidadeTotal = quantidadeUtilizada + qntLitros;
    // Verificar se excedeu (maior ou igual ao limite)
    const excedeu = novaQuantidadeTotal >= quantidadeLimite;
    const quantidadeDisponivel = Math.max(0, quantidadeLimite - quantidadeUtilizada);
    const excedeuPor = excedeu ? novaQuantidadeTotal - quantidadeLimite : 0;

    // Formatar nome da periodicidade
    const periodicidadeNome = {
      [Periodicidade.Diario]: 'Diária',
      [Periodicidade.Semanal]: 'Semanal',
      [Periodicidade.Mensal]: 'Mensal',
    }[veiculo.periodicidade] || veiculo.periodicidade;

    // Formatar mensagem
    let mensagem = '';
    if (excedeu) {
      mensagem = `A quantidade solicitada (${qntLitros} litros) excede a cota ${periodicidadeNome.toLowerCase()} do veículo. Cota disponível: ${quantidadeDisponivel.toFixed(2)} litros. Limite: ${quantidadeLimite.toFixed(2)} litros. Quantidade já utilizada no período: ${quantidadeUtilizada.toFixed(2)} litros. Excesso: ${excedeuPor.toFixed(2)} litros.`;
    } else {
      mensagem = `A quantidade solicitada (${qntLitros} litros) está dentro da cota ${periodicidadeNome.toLowerCase()} do veículo. Cota disponível: ${quantidadeDisponivel.toFixed(2)} litros. Limite: ${quantidadeLimite.toFixed(2)} litros. Quantidade já utilizada no período: ${quantidadeUtilizada.toFixed(2)} litros. Após este abastecimento, restará: ${(quantidadeDisponivel - qntLitros).toFixed(2)} litros.`;
    }

    return {
      message: mensagem,
      excedeu,
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
        tipo_abastecimento: veiculo.tipo_abastecimento,
        periodicidade: veiculo.periodicidade,
        periodicidadeNome,
      },
      cota: {
        quantidadeLimite: quantidadeLimite,
        quantidadeUtilizada: quantidadeUtilizada,
        quantidadeDisponivel: quantidadeDisponivel,
        quantidadeSolicitada: qntLitros,
        novaQuantidadeTotal: novaQuantidadeTotal,
        excedeuPor: excedeuPor,
      },
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        tipo: periodicidadeNome,
      },
    };
  }

  /**
   * Calcula o intervalo de período baseado na periodicidade
   */
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
}
