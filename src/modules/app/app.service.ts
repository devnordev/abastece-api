import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  StatusProcesso,
  TipoContrato,
} from '@prisma/client';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista os combustíveis permitidos para solicitação de abastecimento de um veículo
   * Retorna os combustíveis que estão tanto cadastrados no veículo quanto na cota do órgão
   * Também retorna todos os combustíveis da cota do órgão
   * Apenas permite acesso a veículos da prefeitura do usuário logado
   */
  async listarCombustiveisPermitidosParaVeiculo(
    veiculoId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
  ) {
    // Buscar veículo com órgão e combustíveis
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: {
        prefeitura: {
          select: {
            id: true,
            nome: true,
          },
        },
        orgao: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            prefeituraId: true,
          },
        },
        combustiveis: {
          where: {
            ativo: true,
          },
          select: {
            combustivelId: true,
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
    });

    if (!veiculo) {
      throw new NotFoundException(`Veículo com ID ${veiculoId} não encontrado`);
    }

    // Validar se o veículo pertence à prefeitura do usuário logado
    const prefeituraIdUsuario = user?.prefeitura?.id;
    if (prefeituraIdUsuario && veiculo.prefeituraId !== prefeituraIdUsuario) {
      throw new ForbiddenException(
        `Você não tem permissão para acessar veículos de outras prefeituras. Este veículo pertence à prefeitura ID ${veiculo.prefeituraId}.`,
      );
    }

    if (!veiculo.orgaoId || !veiculo.orgao) {
      return {
        message: 'Combustíveis permitidos recuperados com sucesso',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
        },
        orgao: null,
        processo: null,
        combustiveisPermitidos: [],
        combustiveisCotaOrgao: [],
        observacao: 'Veículo não possui órgão vinculado',
      };
    }

    const orgaoId = veiculo.orgaoId;
    const prefeituraId = veiculo.orgao.prefeituraId;

    // Buscar processo ativo da prefeitura
    const processo = await this.prisma.processo.findFirst({
      where: {
        prefeituraId,
        tipo_contrato: TipoContrato.OBJETIVO,
        status: StatusProcesso.ATIVO,
        ativo: true,
      },
      select: {
        id: true,
        numero_processo: true,
        status: true,
      },
    });

    if (!processo) {
      return {
        message: 'Combustíveis permitidos recuperados com sucesso',
        veiculo: {
          id: veiculo.id,
          nome: veiculo.nome,
          placa: veiculo.placa,
        },
        orgao: {
          id: veiculo.orgao.id,
          nome: veiculo.orgao.nome,
          sigla: veiculo.orgao.sigla,
        },
        processo: null,
        combustiveisPermitidos: [],
        combustiveisCotaOrgao: [],
        observacao: 'Não há processo ativo para a prefeitura do órgão',
      };
    }

    // Buscar todas as cotas ativas do órgão no processo
    const cotasOrgao = await this.prisma.cotaOrgao.findMany({
      where: {
        processoId: processo.id,
        orgaoId,
        ativa: true,
      },
      include: {
        combustivel: {
          select: {
            id: true,
            nome: true,
            sigla: true,
          },
        },
      },
    });

    // IDs dos combustíveis na cota do órgão
    const combustiveisIdsCotaOrgao = new Set(cotasOrgao.map((cota) => cota.combustivelId));

    // Combustíveis permitidos = interseção entre combustíveis do veículo e cota do órgão
    const combustiveisPermitidos = veiculo.combustiveis.filter((vc) =>
      combustiveisIdsCotaOrgao.has(vc.combustivelId),
    );

    // Todos os combustíveis da cota do órgão
    const combustiveisCotaOrgao = cotasOrgao.map((cota) => ({
      combustivelId: cota.combustivelId,
      combustivel: cota.combustivel,
      quantidade: Number(cota.quantidade),
      quantidade_utilizada: Number(cota.quantidade_utilizada),
      restante: cota.restante ? Number(cota.restante) : null,
      saldo_disponivel_cota: cota.saldo_disponivel_cota ? Number(cota.saldo_disponivel_cota) : null,
    }));

    return {
      message: 'Combustíveis permitidos recuperados com sucesso',
      veiculo: {
        id: veiculo.id,
        nome: veiculo.nome,
        placa: veiculo.placa,
      },
      orgao: {
        id: veiculo.orgao.id,
        nome: veiculo.orgao.nome,
        sigla: veiculo.orgao.sigla,
      },
      processo: {
        id: processo.id,
        numero_processo: processo.numero_processo,
        status: processo.status,
      },
      combustiveisPermitidos: combustiveisPermitidos.map((vc) => ({
        combustivelId: vc.combustivelId,
        combustivel: vc.combustivel,
      })),
      combustiveisCotaOrgao,
      totalPermitidos: combustiveisPermitidos.length,
      totalCotaOrgao: combustiveisCotaOrgao.length,
    };
  }
}

