import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ExportModelConfig = {
  prismaDelegate: string;
  hasPrefeituraId: boolean;
  prefeituraIdField?: string;
  excludeFields?: string[];
};

const DEFAULT_LIMIT = 100000;

const MODEL_WHITELIST: Record<string, ExportModelConfig> = {
  prefeitura: {
    prismaDelegate: 'prefeitura',
    hasPrefeituraId: false,
  },
  usuario: {
    prismaDelegate: 'usuario',
    hasPrefeituraId: false,
    excludeFields: ['senha'],
  },
  empresa: {
    prismaDelegate: 'empresa',
    hasPrefeituraId: false,
  },
  orgao: {
    prismaDelegate: 'orgao',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  contrato: {
    prismaDelegate: 'contrato',
    hasPrefeituraId: false,
  },
  combustivel: {
    prismaDelegate: 'combustivel',
    hasPrefeituraId: false,
  },
  categoria: {
    prismaDelegate: 'categoria',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  motorista: {
    prismaDelegate: 'motorista',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  veiculo: {
    prismaDelegate: 'veiculo',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  abastecimento: {
    prismaDelegate: 'abastecimento',
    hasPrefeituraId: false,
  },
  cotaOrgao: {
    prismaDelegate: 'cotaOrgao',
    hasPrefeituraId: false,
  },
  contaFaturamentoOrgao: {
    prismaDelegate: 'contaFaturamentoOrgao',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  processo: {
    prismaDelegate: 'processo',
    hasPrefeituraId: false,
  },
  solicitacaoAbastecimento: {
    prismaDelegate: 'solicitacaoAbastecimento',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  veiculoCotaPeriodo: {
    prismaDelegate: 'veiculoCotaPeriodo',
    hasPrefeituraId: false,
  },
  solicitacoesQrCodeVeiculo: {
    prismaDelegate: 'solicitacoesQrCodeVeiculo',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeitura_id',
  },
  qrcodeMotorista: {
    prismaDelegate: 'qrCodeMotorista',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeitura_id',
  },
  contratoCombustivel: {
    prismaDelegate: 'contratoCombustivel',
    hasPrefeituraId: false,
  },
  veiculoCombustivel: {
    prismaDelegate: 'veiculoCombustivel',
    hasPrefeituraId: false,
  },
  veiculoCategoria: {
    prismaDelegate: 'veiculoCategoria',
    hasPrefeituraId: false,
  },
  veiculoMotorista: {
    prismaDelegate: 'veiculoMotorista',
    hasPrefeituraId: false,
  },
  usuarioOrgao: {
    prismaDelegate: 'usuarioOrgao',
    hasPrefeituraId: false,
  },
  processoCombustivel: {
    prismaDelegate: 'processoCombustivel',
    hasPrefeituraId: false,
  },
  processoPrefeituraConsorcio: {
    prismaDelegate: 'processoPrefeituraConsorcio',
    hasPrefeituraId: false,
  },
  processoPrefeituraCombustivelConsorcio: {
    prismaDelegate: 'processoPrefeituraCombustivelConsorcio',
    hasPrefeituraId: false,
  },
  empresaPrecoCombustivel: {
    prismaDelegate: 'empresaPrecoCombustivel',
    hasPrefeituraId: false,
  },
  aditivoContrato: {
    prismaDelegate: 'aditivoContrato',
    hasPrefeituraId: false,
  },
  aditivoProcesso: {
    prismaDelegate: 'aditivoProcesso',
    hasPrefeituraId: false,
  },
  anpSemana: {
    prismaDelegate: 'anpSemana',
    hasPrefeituraId: false,
  },
  anpPrecosUf: {
    prismaDelegate: 'anpPrecosUf',
    hasPrefeituraId: false,
  },
  logsAlteracoes: {
    prismaDelegate: 'logsAlteracoes',
    hasPrefeituraId: false,
  },
  parametrosTeto: {
    prismaDelegate: 'parametrosTeto',
    hasPrefeituraId: false,
  },
  modeloExportacao: {
    prismaDelegate: 'modeloExportacao',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  termoAceite: {
    prismaDelegate: 'termoAceite',
    hasPrefeituraId: false,
  },
  regraAlerta: {
    prismaDelegate: 'regraAlerta',
    hasPrefeituraId: false,
  },
  configuracaoAlerta: {
    prismaDelegate: 'configuracaoAlerta',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  alerta: {
    prismaDelegate: 'alerta',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
  solicitacaoRastreamento: {
    prismaDelegate: 'solicitacaoRastreamento',
    hasPrefeituraId: true,
    prefeituraIdField: 'prefeituraId',
  },
};

@Injectable()
export class SuperadminExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna a ordem de exportação baseada em dependências (foreign keys)
   * Tabelas são ordenadas para que as dependências sejam exportadas antes das tabelas que dependem delas
   */
  getExportOrder(): string[] {
    return [
      // Nível 1: Tabelas sem dependências (raiz)
      'prefeitura',
      'empresa',
      'combustivel',
      'regraAlerta',
      'anpSemana',
      'parametrosTeto',
      
      // Nível 2: Dependem apenas de Prefeitura ou Empresa
      'usuario',
      'orgao',
      'categoria',
      'motorista',
      'contrato',
      'processo',
      
      // Nível 3: Dependem de tabelas do nível 2
      'contaFaturamentoOrgao', // depende de Prefeitura e Orgao
      'veiculo', // depende de Prefeitura, Orgao (opcional), ContaFaturamentoOrgao (opcional)
      'cotaOrgao', // depende de Processo, Orgao, Combustivel
      'processoCombustivel', // depende de Processo, Combustivel
      'processoPrefeituraConsorcio', // depende de Processo, Prefeitura
      'processoPrefeituraCombustivelConsorcio', // depende de Processo, Prefeitura, Combustivel
      'configuracaoAlerta', // depende de Prefeitura, RegraAlerta
      
      // Nível 4: Dependem de Veiculo ou outras tabelas do nível 3
      'veiculoCotaPeriodo', // depende de Veiculo
      'solicitacaoAbastecimento', // depende de Prefeitura, Veiculo, Motorista (opcional), Combustivel, Empresa
      'solicitacoesQrCodeVeiculo', // depende de Veiculo, Prefeitura
      'solicitacaoRastreamento', // depende de Veiculo, Prefeitura, Usuario
      'alerta', // depende de Prefeitura, ConfiguracaoAlerta (opcional), RegraAlerta, Veiculo (opcional), Usuario (opcional)
      
      // Nível 5: Dependem de Solicitação ou outras tabelas do nível 4
      'abastecimento', // depende de Veiculo, Motorista (opcional), Combustivel, Empresa, Usuario (opcional), ContaFaturamentoOrgao (opcional), CotaOrgao (opcional), SolicitacaoAbastecimento (opcional)
      
      // Nível 6: Tabelas de relacionamento (many-to-many) - dependem de múltiplas tabelas principais
      'contratoCombustivel', // depende de Contrato, Combustivel
      'veiculoCombustivel', // depende de Veiculo, Combustivel
      'veiculoCategoria', // depende de Veiculo, Categoria
      'veiculoMotorista', // depende de Veiculo, Motorista
      'usuarioOrgao', // depende de Usuario, Orgao
      'empresaPrecoCombustivel', // depende de Empresa, Combustivel
      'aditivoContrato', // depende de Contrato
      'aditivoProcesso', // depende de Processo, ProcessoCombustivel (opcional)
      'anpPrecosUf', // depende de AnpSemana
      'qrcodeMotorista', // depende de Motorista, Prefeitura
      
      // Nível 7: Tabelas auxiliares e logs
      'modeloExportacao', // depende de Prefeitura, Usuario
      'termoAceite', // depende de Usuario
      'logsAlteracoes', // depende de Usuario (opcional)
    ];
  }

  getAvailableModels(): { value: string; label: string; order: number }[] {
    const labels: Record<string, string> = {
      prefeitura: 'Prefeituras',
      usuario: 'Usuários',
      empresa: 'Empresas',
      orgao: 'Órgãos',
      contrato: 'Contratos',
      combustivel: 'Combustíveis',
      categoria: 'Categorias',
      motorista: 'Motoristas',
      veiculo: 'Veículos',
      abastecimento: 'Abastecimentos',
      cotaOrgao: 'Cotas Órgão',
      contaFaturamentoOrgao: 'Contas Faturamento Órgão',
      processo: 'Processos',
      solicitacaoAbastecimento: 'Solicitações Abastecimento',
      veiculoCotaPeriodo: 'Cotas Período Veículo',
      solicitacoesQrCodeVeiculo: 'Solicitações QR Code Veículo',
      qrcodeMotorista: 'QR Code Motorista',
      contratoCombustivel: 'Contrato Combustível',
      veiculoCombustivel: 'Veículo Combustível',
      veiculoCategoria: 'Veículo Categoria',
      veiculoMotorista: 'Veículo Motorista',
      usuarioOrgao: 'Usuário Órgão',
      processoCombustivel: 'Processo Combustível',
      processoPrefeituraConsorcio: 'Processo Prefeitura Consórcio',
      processoPrefeituraCombustivelConsorcio:
        'Processo Prefeitura Combustível Consórcio',
      empresaPrecoCombustivel: 'Preços Combustível Empresa',
      aditivoContrato: 'Aditivos Contrato',
      aditivoProcesso: 'Aditivos Processo',
      anpSemana: 'Semanas ANP',
      anpPrecosUf: 'Preços ANP por UF',
      logsAlteracoes: 'Logs de Alterações',
      parametrosTeto: 'Parâmetros Teto',
      modeloExportacao: 'Modelos Exportação',
      termoAceite: 'Termos de Aceite',
      regraAlerta: 'Regras de Alerta',
      configuracaoAlerta: 'Configurações de Alerta',
      alerta: 'Alertas',
      solicitacaoRastreamento: 'Solicitações Rastreamento',
    };

    const order = this.getExportOrder();
    const orderMap = new Map<string, number>();
    order.forEach((model, index) => {
      orderMap.set(model, index);
    });

    return Object.keys(MODEL_WHITELIST)
      .map((value) => ({
        value,
        label: labels[value] || value,
        order: orderMap.get(value) ?? 999, // Se não estiver na ordem, coloca no final
      }))
      .sort((a, b) => a.order - b.order);
  }

  async exportModel(
    modelKey: string,
    prefeituraId?: number,
    dataInicial?: string,
    dataFinal?: string,
  ): Promise<{ data: Record<string, unknown>[]; model: string }> {
    const config = MODEL_WHITELIST[modelKey];
    if (!config) {
      throw new BadRequestException(
        `Modelo inválido: ${modelKey}. Modelos disponíveis: ${Object.keys(MODEL_WHITELIST).join(', ')}`,
      );
    }

    if (config.hasPrefeituraId && config.prefeituraIdField) {
      if (prefeituraId == null || prefeituraId <= 0) {
        throw new BadRequestException(
          'prefeituraId é obrigatório para este modelo',
        );
      }
    }

    const prisma = this.prisma as any;
    const delegate = prisma[config.prismaDelegate];
    if (!delegate || typeof delegate.findMany !== 'function') {
      throw new BadRequestException(
        `Modelo não disponível: ${config.prismaDelegate}`,
      );
    }

    const where: Record<string, unknown> = {};
    if (config.hasPrefeituraId && config.prefeituraIdField && prefeituraId) {
      where[config.prefeituraIdField] = prefeituraId;
    }

    // Para solicitacaoAbastecimento e abastecimento, aplicar filtro de data padrão se não fornecido
    const shouldApplyDefaultDateFilter = 
      (modelKey === 'solicitacaoAbastecimento' || modelKey === 'abastecimento') &&
      (!dataInicial || !dataFinal);
    
    if (shouldApplyDefaultDateFilter) {
      // Filtro padrão: 01/01/2026 a 01/03/2026
      dataInicial = '2026-01-01T00:00:00.000Z';
      const endDate = new Date('2026-03-01');
      endDate.setHours(23, 59, 59, 999);
      dataFinal = endDate.toISOString();
    }

    if (dataInicial && dataFinal) {
      const dateFields = this.getDateFieldsForModel(modelKey);
      if (dateFields.length > 0) {
        const dateFilter: Record<string, unknown> = {};
        if (dataInicial) {
          dateFilter.gte = new Date(dataInicial);
        }
        if (dataFinal) {
          const end = new Date(dataFinal);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        where[dateFields[0]] = dateFilter;
      }
    }

    try {
      const records = await delegate.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        take: DEFAULT_LIMIT,
        orderBy: { id: 'asc' } as any,
      });

      const serialized = records.map((record: any) =>
        this.serializeRecord(record, config.excludeFields || []),
      );

      return { data: serialized, model: modelKey };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`[SuperadminExport] Erro ao exportar ${modelKey}:`, msg);
      throw new InternalServerErrorException(
        `Erro ao exportar ${modelKey}: ${msg}`,
      );
    }
  }

  private getDateFieldsForModel(modelKey: string): string[] {
    const dateFieldsMap: Record<string, string[]> = {
      solicitacaoAbastecimento: ['data_solicitacao'], // Usar data_solicitacao como campo principal para filtro
      abastecimento: ['data_abastecimento'], // Usar data_abastecimento como campo principal para filtro
      logsAlteracoes: ['executado_em'],
      solicitacoesQrCodeVeiculo: ['data_cadastro'],
      qrcodeMotorista: ['data_cadastro'],
    };
    return dateFieldsMap[modelKey] ?? [];
  }

  private serializeRecord(
    record: Record<string, unknown>,
    excludeFields: string[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    // Usar Object.keys + acesso direto para garantir todas as propriedades do registro (Prisma pode retornar objetos com getters)
    const keys = Object.keys(record).length > 0 ? Object.keys(record) : Object.getOwnPropertyNames(record);
    for (const key of keys) {
      if (excludeFields.includes(key)) continue;
      const value = (record as any)[key];
      if (value === undefined) continue;
      result[key] = this.serializeValue(value);
    }
    return result;
  }

  private serializeValue(value: unknown): unknown {
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as any).toString === 'function'
    ) {
      const str = (value as any).toString();
      const num = parseFloat(str);
      if (!isNaN(num) && isFinite(num)) return num;
      return str;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }
}
