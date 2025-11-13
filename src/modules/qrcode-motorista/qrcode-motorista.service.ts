import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FilterSolicitacoesDto } from './dto/filter-solicitacoes.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusQrCodeMotorista } from '@prisma/client';
import { gerarCodigoQrUnico } from '../../common/utils/qrcode-generator.util';

@Injectable()
export class QrCodeMotoristaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas as solicitações agrupadas por prefeitura
   * Apenas SUPER_ADMIN pode acessar
   */
  async findAllGroupedByPrefeitura(filterDto: FilterSolicitacoesDto) {
    const { prefeituraId, status, page = 1, limit = 10 } = filterDto;

    const skip = (page - 1) * limit;

    // Construir filtro
    const where: any = {};
    if (prefeituraId) {
      where.prefeitura_id = prefeituraId;
    }
    if (status) {
      // Converter enum para valor do Prisma
      where.status = status;
    }

    // Buscar solicitações com relacionamentos
    const [solicitacoes, total] = await Promise.all([
      (this.prisma as any).qrCodeMotorista.findMany({
        where,
        include: {
          motorista: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              email: true,
              telefone: true,
              imagem_perfil: true,
              prefeitura: {
                select: {
                  id: true,
                  nome: true,
                  cnpj: true,
                },
              },
            },
          },
          prefeitura: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
        },
        orderBy: {
          data_cadastro: 'desc',
        },
        skip,
        take: limit,
      }),
      (this.prisma as any).qrCodeMotorista.count({ where }),
    ]);

    // Agrupar por prefeitura
    const agrupadoPorPrefeitura = solicitacoes.reduce((acc: any, solicitacao: any) => {
      const prefeituraId = solicitacao.prefeitura_id;
      if (!acc[prefeituraId]) {
        acc[prefeituraId] = {
          prefeitura: solicitacao.prefeitura,
          solicitacoes: [],
        };
      }
      acc[prefeituraId].solicitacoes.push(solicitacao);
      return acc;
    }, {});

    // Converter objeto em array
    const grupos = Object.values(agrupadoPorPrefeitura);

    return {
      message: 'Solicitações encontradas com sucesso',
      grupos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza o status de uma solicitação
   */
  async updateStatus(id: number, updateStatusDto: UpdateStatusDto, currentUserId: number) {
    // Verificar se a solicitação existe
    const solicitacao = await (this.prisma as any).qrCodeMotorista.findUnique({
      where: { id },
      include: {
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new NotFoundException(`Solicitação com ID ${id} não encontrada`);
    }

    // Validar transições de status
    this.validateStatusTransition(solicitacao.status, updateStatusDto.status);

    // Validar motivo de cancelamento quando status é Cancelado
    if (updateStatusDto.status === StatusQrCodeMotorista.Cancelado && !updateStatusDto.motivoCancelamento) {
      throw new BadRequestException('Motivo do cancelamento é obrigatório quando o status é Cancelado');
    }

    // Buscar informações do usuário
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        nome: true,
        tipo_usuario: true,
      },
    });

    if (!usuario) {
      throw new ForbiddenException('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateData: any = {
      status: updateStatusDto.status,
    };

    // Se for cancelamento, preencher campos de cancelamento
    if (updateStatusDto.status === StatusQrCodeMotorista.Cancelado) {
      updateData.data_cancelamento = new Date();
      updateData.motivo_cancelamento = updateStatusDto.motivoCancelamento;
      updateData.cancelamento_efetuado_por = usuario.nome || `Usuario ${usuario.id}`;
    } else {
      // Se mudar de Cancelado para outro status, limpar campos de cancelamento
      if (solicitacao.status === StatusQrCodeMotorista.Cancelado) {
        updateData.data_cancelamento = null;
        updateData.motivo_cancelamento = null;
        updateData.cancelamento_efetuado_por = null;
        updateData.cancelamento_solicitado_por = null;
      }
    }

    // Se o status for "Aprovado" e ainda não tiver código QR, gerar um código único
    if (updateStatusDto.status === StatusQrCodeMotorista.Aprovado && !solicitacao.codigo_qrcode) {
      let codigoUnico = false;
      let codigoQr = '';
      
      // Garantir que o código seja único (verificar em ambas as tabelas)
      while (!codigoUnico) {
        codigoQr = gerarCodigoQrUnico();
        const codigoExistenteVeiculo = await (this.prisma as any).solicitacoesQrCodeVeiculo.findFirst({
          where: { codigo_qrcode: codigoQr },
        });
        const codigoExistenteMotorista = await (this.prisma as any).qrCodeMotorista.findFirst({
          where: { codigo_qrcode: codigoQr },
        });
        
        if (!codigoExistenteVeiculo && !codigoExistenteMotorista) {
          codigoUnico = true;
        }
      }
      
      updateData.codigo_qrcode = codigoQr;
    }

    // Atualizar solicitação
    const solicitacaoAtualizada = await (this.prisma as any).qrCodeMotorista.update({
      where: { id },
      data: updateData,
      include: {
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            email: true,
            telefone: true,
            imagem_perfil: true,
            prefeitura: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    return {
      message: `Status da solicitação atualizado para ${updateStatusDto.status} com sucesso`,
      solicitacao: solicitacaoAtualizada,
    };
  }

  /**
   * Valida transições de status permitidas
   */
  private validateStatusTransition(currentStatus: string, newStatus: string) {
    // Se for o mesmo status, permitir
    if (currentStatus === newStatus) {
      return true;
    }

    // Transições permitidas (usar valores do enum do Prisma)
    const transicoesPermitidas: { [key: string]: StatusQrCodeMotorista[] } = {
      [StatusQrCodeMotorista.Solicitado]: [
        StatusQrCodeMotorista.Aprovado,
        StatusQrCodeMotorista.Cancelado,
        StatusQrCodeMotorista.Inativo,
      ],
      [StatusQrCodeMotorista.Aprovado]: [
        StatusQrCodeMotorista.Em_Producao,
        StatusQrCodeMotorista.Cancelado,
        StatusQrCodeMotorista.Inativo,
      ],
      [StatusQrCodeMotorista.Em_Producao]: [
        StatusQrCodeMotorista.Integracao,
        StatusQrCodeMotorista.Cancelado,
        StatusQrCodeMotorista.Inativo,
      ],
      [StatusQrCodeMotorista.Integracao]: [
        StatusQrCodeMotorista.Concluida,
        StatusQrCodeMotorista.Cancelado,
        StatusQrCodeMotorista.Inativo,
      ],
      [StatusQrCodeMotorista.Concluida]: [
        StatusQrCodeMotorista.Cancelado,
        StatusQrCodeMotorista.Inativo,
      ],
      [StatusQrCodeMotorista.Inativo]: [
        StatusQrCodeMotorista.Solicitado,
        StatusQrCodeMotorista.Aprovado,
        StatusQrCodeMotorista.Em_Producao,
        StatusQrCodeMotorista.Integracao,
        StatusQrCodeMotorista.Concluida,
      ],
      [StatusQrCodeMotorista.Cancelado]: [], // Cancelado é permanente, não pode mudar
    };

    const transicoes = transicoesPermitidas[currentStatus as StatusQrCodeMotorista] || [];

    if (!transicoes.includes(newStatus as StatusQrCodeMotorista)) {
      throw new BadRequestException(
        `Não é possível alterar o status de "${currentStatus}" para "${newStatus}". ` +
        `Transições permitidas de "${currentStatus}": ${transicoes.join(', ') || 'nenhuma'}`
      );
    }

    return true;
  }

  /**
   * Busca uma solicitação por ID
   */
  async findOne(id: number) {
    const solicitacao = await (this.prisma as any).qrCodeMotorista.findUnique({
      where: { id },
      include: {
        motorista: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            email: true,
            telefone: true,
            imagem_perfil: true,
            prefeitura: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        },
        prefeitura: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    if (!solicitacao) {
      throw new NotFoundException(`Solicitação com ID ${id} não encontrada`);
    }

    return {
      message: 'Solicitação encontrada com sucesso',
      solicitacao,
    };
  }
}

