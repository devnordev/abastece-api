import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  StatusProcesso,
  TipoContrato,
  StatusPreco,
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

  /**
   * Verifica se a empresa do usuário logado tem preço cadastrado para um combustível
   * Retorna informações do preço se existir, caso contrário retorna erro
   */
  async verificarPrecoCombustivelEmpresa(
    combustivelId: number,
    user: {
      id: number;
      tipo_usuario: string;
      prefeitura?: { id: number; nome: string; cnpj: string };
      empresa?: { id: number; nome: string; cnpj: string; uf?: string | null };
    },
  ) {
    const empresaId = user?.empresa?.id;
    
    if (!empresaId) {
      throw new ForbiddenException('Usuário não está vinculado a uma empresa');
    }

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

    // Buscar preço ativo do combustível para a empresa
    const precoCombustivel = await this.prisma.empresaPrecoCombustivel.findFirst({
      where: {
        empresa_id: empresaId,
        combustivel_id: combustivelId,
        status: StatusPreco.ACTIVE,
      },
      select: {
        id: true,
        empresa_id: true,
        combustivel_id: true,
        preco_atual: true,
        teto_vigente: true,
        anp_base: true,
        anp_base_valor: true,
        margem_app_pct: true,
        uf_referencia: true,
        status: true,
        updated_at: true,
        updated_by: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    if (!precoCombustivel || !precoCombustivel.preco_atual) {
      return {
        message: 'Preço não encontrado para este combustível na empresa',
        possuiPreco: false,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          cnpj: empresa.cnpj,
        },
        combustivel: {
          id: combustivel.id,
          nome: combustivel.nome,
          sigla: combustivel.sigla,
        },
      };
    }

    return {
      message: 'Preço encontrado com sucesso',
      possuiPreco: true,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
      },
      combustivel: {
        id: combustivel.id,
        nome: combustivel.nome,
        sigla: combustivel.sigla,
      },
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
      },
    };
  }
}

