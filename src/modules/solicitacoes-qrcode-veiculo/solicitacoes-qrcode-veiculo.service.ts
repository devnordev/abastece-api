import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FilterSolicitacoesDto } from './dto/filter-solicitacoes.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { StatusSolicitacaoQrCodeVeiculo } from '@prisma/client';
import { gerarCodigoQrUnico } from '../../common/utils/qrcode-generator.util';

@Injectable()
export class SolicitacoesQrCodeVeiculoService {
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
      // Converter enum para valor do Prisma (ex: Em_Producao -> Em_Producao)
      where.status = status;
    }

    // Buscar solicitações com relacionamentos
    const [solicitacoes, total] = await Promise.all([
      (this.prisma as any).solicitacoesQrCodeVeiculo.findMany({
        where,
        include: {
          veiculo: {
            select: {
              id: true,
              nome: true,
              placa: true,
              modelo: true,
              tipo_veiculo: true,
              orgao: {
                select: {
                  id: true,
                  nome: true,
                  sigla: true,
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
      (this.prisma as any).solicitacoesQrCodeVeiculo.count({ where }),
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
    const solicitacao = await (this.prisma as any).solicitacoesQrCodeVeiculo.findUnique({
      where: { id },
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
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
    if (updateStatusDto.status === StatusSolicitacaoQrCodeVeiculo.Cancelado && !updateStatusDto.motivoCancelamento) {
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
    if (updateStatusDto.status === StatusSolicitacaoQrCodeVeiculo.Cancelado) {
      updateData.data_cancelamento = new Date();
      updateData.motivo_cancelamento = updateStatusDto.motivoCancelamento;
      updateData.cancelamento_efetuado_por = usuario.nome || `Usuario ${usuario.id}`;
    } else {
      // Se mudar de Cancelado para outro status, limpar campos de cancelamento
      if (solicitacao.status === StatusSolicitacaoQrCodeVeiculo.Cancelado) {
        updateData.data_cancelamento = null;
        updateData.motivo_cancelamento = null;
        updateData.cancelamento_efetuado_por = null;
        updateData.cancelamento_solicitado_por = null;
      }
    }

    // Se o status for "Aprovado" e ainda não tiver código QR, gerar um código único
    if (updateStatusDto.status === StatusSolicitacaoQrCodeVeiculo.Aprovado && !solicitacao.codigo_qrcode) {
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
    const solicitacaoAtualizada = await (this.prisma as any).solicitacoesQrCodeVeiculo.update({
      where: { id },
      data: updateData,
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
            tipo_veiculo: true,
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
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
    const transicoesPermitidas: { [key: string]: StatusSolicitacaoQrCodeVeiculo[] } = {
      [StatusSolicitacaoQrCodeVeiculo.Solicitado]: [
        StatusSolicitacaoQrCodeVeiculo.Aprovado,
        StatusSolicitacaoQrCodeVeiculo.Cancelado,
        StatusSolicitacaoQrCodeVeiculo.Inativo,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Aprovado]: [
        StatusSolicitacaoQrCodeVeiculo.Em_Producao,
        StatusSolicitacaoQrCodeVeiculo.Cancelado,
        StatusSolicitacaoQrCodeVeiculo.Inativo,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Em_Producao]: [
        StatusSolicitacaoQrCodeVeiculo.Integracao,
        StatusSolicitacaoQrCodeVeiculo.Cancelado,
        StatusSolicitacaoQrCodeVeiculo.Inativo,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Integracao]: [
        StatusSolicitacaoQrCodeVeiculo.Concluida,
        StatusSolicitacaoQrCodeVeiculo.Cancelado,
        StatusSolicitacaoQrCodeVeiculo.Inativo,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Concluida]: [
        StatusSolicitacaoQrCodeVeiculo.Cancelado,
        StatusSolicitacaoQrCodeVeiculo.Inativo,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Inativo]: [
        StatusSolicitacaoQrCodeVeiculo.Solicitado,
        StatusSolicitacaoQrCodeVeiculo.Aprovado,
        StatusSolicitacaoQrCodeVeiculo.Em_Producao,
        StatusSolicitacaoQrCodeVeiculo.Integracao,
        StatusSolicitacaoQrCodeVeiculo.Concluida,
      ],
      [StatusSolicitacaoQrCodeVeiculo.Cancelado]: [], // Cancelado é permanente, não pode mudar
    };

    const transicoes = transicoesPermitidas[currentStatus as StatusSolicitacaoQrCodeVeiculo] || [];

    if (!transicoes.includes(newStatus as StatusSolicitacaoQrCodeVeiculo)) {
      throw new BadRequestException(
        `Não é possível alterar o status de "${currentStatus}" para "${newStatus}". ` +
        `Transições permitidas de "${currentStatus}": ${transicoes.join(', ') || 'nenhuma'}`
      );
    }

    return true;
  }

  /**
   * Busca uma solicitação por ID ou código QR code
   * Aceita tanto ID numérico quanto código QR code (string)
   */
  async findOne(idOrCode: string | number) {
    // Determinar se é um ID numérico ou código QR code
    // Se for number ou string completamente numérica, é ID
    // Caso contrário, é código QR code
    const isNumericId = 
      typeof idOrCode === 'number' || 
      (/^\d+$/.test(String(idOrCode).trim()) && String(idOrCode).trim() !== '');
    
    let whereClause: any;
    if (isNumericId) {
      // Buscar por ID
      whereClause = { id: Number(idOrCode) };
    } else {
      // Buscar por código QR code
      whereClause = { codigo_qrcode: String(idOrCode) };
    }

    const solicitacao = await (this.prisma as any).solicitacoesQrCodeVeiculo.findFirst({
      where: whereClause,
      include: {
        veiculo: {
          select: {
            id: true,
            nome: true,
            placa: true,
            modelo: true,
            tipo_veiculo: true,
            orgao: {
              select: {
                id: true,
                nome: true,
                sigla: true,
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
      const tipoBusca = isNumericId ? `ID ${idOrCode}` : `código QR code ${idOrCode}`;
      throw new NotFoundException(`Solicitação com ${tipoBusca} não encontrada`);
    }

    return {
      message: 'Solicitação encontrada com sucesso',
      solicitacao,
    };
  }
}

