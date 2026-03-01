import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type ExportModelConfig = {
  prismaDelegate: string;
  hasPrefeituraId: boolean;
  prefeituraIdField?: string;
  excludeFields?: string[];
};

const DEFAULT_LIMIT = 10000;

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

  getAvailableModels(): { value: string; label: string }[] {
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

    return Object.keys(MODEL_WHITELIST).map((value) => ({
      value,
      label: labels[value] || value,
    }));
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

    const records = await delegate.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      take: DEFAULT_LIMIT,
      orderBy: { id: 'asc' } as any,
    });

    const serialized = records.map((record: any) =>
      this.serializeRecord(record, config.excludeFields || []),
    );

    return { data: serialized, model: modelKey };
  }

  private getDateFieldsForModel(modelKey: string): string[] {
    const dateFieldsMap: Record<string, string[]> = {
      solicitacaoAbastecimento: ['data_solicitacao', 'data_expiracao'],
      abastecimento: ['data_abastecimento', 'created_date'],
      logsAlteracoes: ['executado_em'],
    };
    return dateFieldsMap[modelKey] || ['created_date', 'modified_date', 'data_cadastro'];
  }

  private serializeRecord(
    record: Record<string, unknown>,
    excludeFields: string[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (excludeFields.includes(key)) continue;
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
