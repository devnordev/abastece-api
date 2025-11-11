import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { Prisma, StatusAbastecimento, StatusSolicitacao, TipoAbastecimento } from '@prisma/client';

@Injectable()
export class AbastecimentoService {
  constructor(private prisma: PrismaService) {}

  async create(createAbastecimentoDto: CreateAbastecimentoDto, user: any) {
    const { veiculoId, combustivelId, empresaId } = createAbastecimentoDto;

    // Verificar se o usuário pertence à empresa informada (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new BadRequestException(
        'Usuário não está vinculado a uma empresa. Apenas usuários de empresa podem criar abastecimentos.'
      );
    }

    if (user.empresa.id !== empresaId) {
      throw new BadRequestException(
        'Você não pode criar abastecimento para uma empresa diferente da sua. A empresa do abastecimento deve corresponder à empresa do usuário logado.'
      );
    }

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

    // Verificar se a empresa está ativa
    if (!empresa.ativo) {
      throw new BadRequestException('Não é possível criar abastecimento para uma empresa inativa');
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

  async createFromSolicitacao(createDto: CreateAbastecimentoFromSolicitacaoDto, user: any) {
    const { solicitacaoId, data_abastecimento, status, odometro, orimetro, validadorId, abastecedorId, desconto, preco_anp, abastecido_por, nfe_link, ativo } = createDto;

    // Verificar se o usuário pertence a uma empresa (obrigatório para ADMIN_EMPRESA e COLABORADOR_EMPRESA)
    if (!user?.empresa?.id) {
      throw new BadRequestException(
        'Usuário não está vinculado a uma empresa. Apenas usuários de empresa podem criar abastecimentos.'
      );
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
      throw new NotFoundException(`Solicitação de abastecimento com ID ${solicitacaoId} não encontrada`);
    }

    // Verificar se a empresa da solicitação corresponde à empresa do usuário
    if (solicitacao.empresaId !== user.empresa.id) {
      throw new BadRequestException(
        'Você não pode criar abastecimento para uma solicitação de outra empresa. A empresa da solicitação deve corresponder à empresa do usuário logado.'
      );
    }

    // Verificar se a empresa da solicitação está ativa
    if (!solicitacao.empresa.ativo) {
      throw new BadRequestException('Não é possível criar abastecimento para uma empresa inativa');
    }

    // Verificar se a solicitação já tem um abastecimento vinculado
    if (solicitacao.abastecimento_id) {
      throw new ConflictException(`A solicitação ${solicitacaoId} já possui um abastecimento vinculado (ID: ${solicitacao.abastecimento_id})`);
    }

    // Verificar se a solicitação está ativa
    if (!solicitacao.ativo) {
      throw new BadRequestException('Não é possível criar abastecimento para uma solicitação inativa');
    }

    // Verificar se a solicitação não está expirada ou rejeitada
    if (solicitacao.status === StatusSolicitacao.EXPIRADA) {
      throw new BadRequestException('Não é possível criar abastecimento para uma solicitação expirada');
    }

    if (solicitacao.status === StatusSolicitacao.REJEITADA) {
      throw new BadRequestException('Não é possível criar abastecimento para uma solicitação rejeitada');
    }

    // Se a solicitação estiver PENDENTE, será aprovada automaticamente antes de criar o abastecimento
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

    // Criar abastecimento e atualizar solicitação em transação
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Se a solicitação estiver PENDENTE, aprovar primeiro
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

      // Criar abastecimento
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
            },
          },
        },
      });

      // Atualizar solicitação com o ID do abastecimento e marcar como EFETIVADA
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
        },
      });

      // Atualizar cota se necessário
      if (cotaId && tipoAbastecimento === TipoAbastecimento.COM_COTA) {
        await tx.cotaOrgao.update({
          where: { id: cotaId },
          data: {
            quantidade_utilizada: {
              increment: Number(solicitacao.quantidade),
            },
          },
        });
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
