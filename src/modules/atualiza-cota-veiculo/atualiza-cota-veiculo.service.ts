import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Periodicidade } from '@prisma/client';
import {
  PdfInvalidoException,
  NomePrefeituraNaoEncontradoNoPdfException,
  PrefeituraNaoEncontradaNoBancoException,
  CabecalhoTabelaNaoEncontradoException,
  NenhumaLinhaValidaEncontradaException,
  OrgaoNaoEncontradoParaPrefeituraException,
  VeiculoNaoEncontradoParaOrgaoException,
  VeiculoSemPeriodicidadeException,
  ErroAoProcessarLinhaPdfException,
  DadosLinhaPdfInvalidosException,
  ArquivoPdfVazioException,
} from '../../common/exceptions';


interface LinhaPdf {
  orgao: string;
  placa: string;
  cota_total: number;
  cota_utilizada: number;
}

export interface VeiculoAtualizado {
  placa: string;
  veiculoId: number;
  id: number;
  quantidade_permitida: number;
  quantidade_utilizada: number;
  quantidade_disponivel: number;
}

@Injectable()
export class AtualizaCotaVeiculoService {
  constructor(private prisma: PrismaService) {}

  private async parsePdf(buffer: Buffer): Promise<{ text: string }> {
    try {
      // Polyfill para DOMMatrix necessário para pdf-parse 2.4.5 no Node.js
      // pdf-parse usa @napi-rs/canvas que já inclui DOMMatrix, mas pode não estar disponível globalmente
      // Criar polyfill básico apenas se necessário
      if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class DOMMatrix {
          a: number;
          b: number;
          c: number;
          d: number;
          e: number;
          f: number;

          constructor(init?: any) {
            if (typeof init === 'string') {
              const values = init.match(/matrix\(([^)]+)\)/)?.[1]?.split(',').map(Number) || [];
              this.a = values[0] || 1;
              this.b = values[1] || 0;
              this.c = values[2] || 0;
              this.d = values[3] || 1;
              this.e = values[4] || 0;
              this.f = values[5] || 0;
            } else {
              this.a = init?.a ?? 1;
              this.b = init?.b ?? 0;
              this.c = init?.c ?? 0;
              this.d = init?.d ?? 1;
              this.e = init?.e ?? 0;
              this.f = init?.f ?? 0;
            }
          }

          multiply(other: DOMMatrix): DOMMatrix {
            const result = new (globalThis.DOMMatrix as any)({});
            result.a = this.a * other.a + this.c * other.b;
            result.b = this.b * other.a + this.d * other.b;
            result.c = this.a * other.c + this.c * other.d;
            result.d = this.b * other.c + this.d * other.d;
            result.e = this.a * other.e + this.c * other.f + this.e;
            result.f = this.b * other.e + this.d * other.f + this.f;
            return result;
          }

          translate(x: number, y: number): DOMMatrix {
            return this.multiply(new (globalThis.DOMMatrix as any)({ e: x, f: y }));
          }

          scale(x: number, y?: number): DOMMatrix {
            return this.multiply(new (globalThis.DOMMatrix as any)({ a: x, d: y ?? x }));
          }
        } as any;
      }

      // pdf-parse 2.4.5 exporta uma classe PDFParse que precisa ser instanciada
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParseModule = require('pdf-parse');
      
      // Obter a classe PDFParse do módulo
      const PDFParseClass = pdfParseModule.PDFParse;
      
      if (!PDFParseClass) {
        throw new PdfInvalidoException('Classe PDFParse não encontrada no módulo pdf-parse');
      }
      
      // Criar instância da classe PDFParse com o buffer
      const parser = new PDFParseClass({ data: buffer });
      
      // Obter o texto do PDF usando o método getText()
      const data = await parser.getText();
      
      // Verificar o formato do retorno (getText retorna TextResult com propriedade text)
      if (data && typeof data.text === 'string') {
        return { text: data.text };
      }
      
      throw new PdfInvalidoException('Formato de retorno do pdf-parse não reconhecido');
    } catch (error: any) {
      // Relançar erros conhecidos
      if (error instanceof PdfInvalidoException) {
        throw error;
      }
      throw new PdfInvalidoException(error?.message || String(error));
    }
  }

  async processarPdf(file: Express.Multer.File) {
    // Validar se o arquivo não está vazio
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new ArquivoPdfVazioException();
    }

    // Extrair texto do PDF
    let pdfData: { text: string };
    let textoCompleto: string;
    
    try {
      pdfData = await this.parsePdf(file.buffer);
      textoCompleto = pdfData.text;
      
      if (!textoCompleto || textoCompleto.trim().length === 0) {
        throw new ArquivoPdfVazioException();
      }
    } catch (error) {
      if (error instanceof ArquivoPdfVazioException) {
        throw error;
      }
      throw new PdfInvalidoException(
        error instanceof Error ? error.message : 'Erro ao processar o arquivo PDF',
      );
    }

    // Extrair nome da prefeitura do PDF
    const nomePrefeitura = this.extrairNomePrefeitura(textoCompleto);
    if (!nomePrefeitura) {
      throw new NomePrefeituraNaoEncontradoNoPdfException();
    }

    // Buscar prefeitura no banco de dados
    const prefeitura = await this.buscarPrefeituraPorNome(nomePrefeitura);
    if (!prefeitura) {
      throw new PrefeituraNaoEncontradaNoBancoException(nomePrefeitura);
    }

    // Extrair linhas do PDF
    const linhasPdf = this.extrairLinhasPdf(textoCompleto);

    const placasNaoAtualizadas: string[] = [];
    const veiculosAtualizados: VeiculoAtualizado[] = [];

    // Processar cada linha do PDF
    const linhaIndexMap = new Map<LinhaPdf, number>();
    linhasPdf.forEach((linha, index) => linhaIndexMap.set(linha, index));

    for (const linha of linhasPdf) {
      const linhaIndex = linhaIndexMap.get(linha) || 0;
      
      try {
        // Validar dados da linha
        if (!linha.orgao || !linha.placa || isNaN(linha.cota_total) || isNaN(linha.cota_utilizada)) {
          const camposFaltando: string[] = [];
          if (!linha.orgao) camposFaltando.push('Órgão');
          if (!linha.placa) camposFaltando.push('Placa');
          if (isNaN(linha.cota_total)) camposFaltando.push('Cota Total');
          if (isNaN(linha.cota_utilizada)) camposFaltando.push('Cota Utilizada');
          
          placasNaoAtualizadas.push(linha.placa || `Linha ${linhaIndex + 1}`);
          continue;
        }

        // Buscar órgão por nome e prefeituraId
        const orgao = await this.buscarOrgaoPorNomeEPrefeituraId(
          linha.orgao,
          prefeitura.id,
        );

        if (!orgao) {
          placasNaoAtualizadas.push(linha.placa);
          continue;
        }

        // Buscar veículo por placa e orgaoId
        const veiculo = await this.buscarVeiculoPorPlacaEOrgaoId(
          linha.placa,
          orgao.id,
        );

        if (!veiculo) {
          placasNaoAtualizadas.push(linha.placa);
          continue;
        }

        // Verificar se veículo tem periodicidade
        if (!veiculo.periodicidade) {
          placasNaoAtualizadas.push(linha.placa);
          continue;
        }

        // Atualizar cota do veículo
        const cotaAtualizada = await this.atualizarCotaVeiculo(
          veiculo.id,
          linha.cota_total,
          linha.cota_utilizada,
          veiculo.periodicidade,
        );

        if (cotaAtualizada) {
          veiculosAtualizados.push({
            placa: linha.placa,
            veiculoId: veiculo.id,
            id: cotaAtualizada.id,
            quantidade_permitida: Number(cotaAtualizada.quantidade_permitida),
            quantidade_utilizada: Number(cotaAtualizada.quantidade_utilizada),
            quantidade_disponivel: Number(cotaAtualizada.quantidade_disponivel),
          });
        } else {
          placasNaoAtualizadas.push(linha.placa);
        }
      } catch (error) {
        // Capturar erros específicos, mas não interromper o processamento das outras linhas
        // Apenas adicionar à lista de não atualizadas
        placasNaoAtualizadas.push(linha.placa);
      }
    }

    return {
      message: 'Processamento concluído com sucesso',
      placas_nao_atualizadas: placasNaoAtualizadas,
      veiculos_atualizados: veiculosAtualizados,
      total_processado: linhasPdf.length,
      total_atualizado: veiculosAtualizados.length,
      total_nao_atualizado: placasNaoAtualizadas.length,
    };
  }

  /**
   * Extrai o nome da prefeitura do texto do PDF
   * Busca no início do documento por padrões comuns
   */
  private extrairNomePrefeitura(texto: string): string | null {
    // Normalizar o texto
    const linhas = texto.split('\n').map((l) => l.trim()).filter((l) => l);

    // Procurar por "Prefeitura" ou "Prefeitura Municipal" nas primeiras linhas
    for (let i = 0; i < Math.min(30, linhas.length); i++) {
      const linha = linhas[i];
      const linhaLower = linha.toLowerCase();
      
      if (linhaLower.includes('prefeitura')) {
        // Tentar extrair o nome após "Prefeitura"
        const match = linha.match(/prefeitura\s+(?:municipal\s+de\s+)?(.+)/i);
        if (match && match[1]) {
          let nome = match[1].trim();
          // Remover caracteres especiais no final
          nome = nome.replace(/[.,;:\-]+$/, '').trim();
          if (nome.length > 3) {
            return nome;
          }
        }
        
        // Se a linha contém "Prefeitura" mas não o nome completo, tentar próxima linha
        if (i + 1 < linhas.length && linhas[i + 1].trim().length > 3) {
          const nome = linhas[i + 1].trim();
          // Verificar se não é outra palavra-chave
          if (!nome.toLowerCase().includes('municipal') && 
              !nome.toLowerCase().includes('de') && 
              nome.length > 3) {
            return nome;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extrai as linhas de dados do PDF
   * Assumindo que o PDF tem uma tabela com colunas: órgão, placa, cota_total, cota_utilizada
   */
  private extrairLinhasPdf(texto: string): LinhaPdf[] {
    const linhas: LinhaPdf[] = [];
    const linhasTexto = texto.split('\n').map((l) => l.trim());

    // Procurar pelo cabeçalho da tabela
    let indiceInicio = -1;
    for (let i = 0; i < linhasTexto.length; i++) {
      const linha = linhasTexto[i].toLowerCase();
      if (
        (linha.includes('órgão') || linha.includes('orgao')) &&
        linha.includes('placa') &&
        (linha.includes('cota') || linha.includes('total') || linha.includes('utilizada'))
      ) {
        indiceInicio = i + 1;
        break;
      }
    }

    if (indiceInicio === -1) {
      throw new CabecalhoTabelaNaoEncontradoException();
    }

    // Extrair dados das linhas seguintes
    for (let i = indiceInicio; i < linhasTexto.length; i++) {
      const linha = linhasTexto[i];
      if (!linha || linha.length < 5) continue;

      // Pular linhas que parecem ser cabeçalhos ou separadores
      const linhaLower = linha.toLowerCase();
      if (linhaLower.includes('órgão') || 
          linhaLower.includes('orgao') ||
          linhaLower.includes('placa') || 
          linhaLower.match(/^[-=\s]+$/) ||
          (linhaLower.includes('total') && linhaLower.includes('geral')) ||
          linhaLower.includes('gerado por:') ||
          linhaLower.includes('--') ||
          linhaLower.match(/\d+\s+de\s+\d+/)) { // Pular linhas como "1 de 2"
        continue;
      }

      // Dividir a linha por espaços múltiplos (2 ou mais) ou tabs
      const colunas = linha
        .split(/\s{2,}|\t/)
        .map((c) => c.trim())
        .filter((c) => c && c.length > 0);

      // Esperamos pelo menos: órgão, placa, cota_total, cota_utilizada
      if (colunas.length >= 4) {
        try {
          // Estratégia: assumir que as últimas duas colunas são sempre numéricas (cota_total e cota_utilizada)
          // A penúltima coluna antes dos números é a placa
          // Tudo antes da placa é o nome do órgão

          const cotaTotalStr = colunas[colunas.length - 2];
          const cotaUtilizadaStr = colunas[colunas.length - 1];
          
          const cotaTotal = this.parseNumero(cotaTotalStr);
          const cotaUtilizada = this.parseNumero(cotaUtilizadaStr);

          // Validar que as últimas duas colunas são números válidos
          if (isNaN(cotaTotal) || isNaN(cotaUtilizada) || cotaTotal < 0 || cotaUtilizada < 0) {
            continue;
          }

          // A placa está na penúltima coluna antes dos números
          const placa = colunas[colunas.length - 3].trim().toUpperCase();
          
          // O órgão é tudo antes da placa
          const orgao = colunas.slice(0, colunas.length - 3).join(' ').trim();

          // Validar que temos todos os campos necessários
          if (orgao && placa && placa.length >= 3) {
            linhas.push({
              orgao,
              placa,
              cota_total: cotaTotal,
              cota_utilizada: cotaUtilizada,
            });
          }
        } catch (error) {
          // Ignorar linhas com erro
          continue;
        }
      }
    }

    if (linhas.length === 0) {
      throw new NenhumaLinhaValidaEncontradaException(linhasTexto.length);
    }

    return linhas;
  }

  /**
   * Converte string para número, removendo caracteres não numéricos exceto vírgula e ponto
   */
  private parseNumero(valor: string): number {
    const limpo = valor.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  }

  /**
   * Busca prefeitura por nome (case-insensitive)
   */
  private async buscarPrefeituraPorNome(nome: string) {
    return this.prisma.prefeitura.findFirst({
      where: {
        nome: {
          contains: nome,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Busca órgão por nome e prefeituraId (case-insensitive)
   */
  private async buscarOrgaoPorNomeEPrefeituraId(nome: string, prefeituraId: number) {
    return this.prisma.orgao.findFirst({
      where: {
        nome: {
          contains: nome,
          mode: 'insensitive',
        },
        prefeituraId,
        ativo: true,
      },
    });
  }

  /**
   * Busca veículo por placa e orgaoId
   */
  private async buscarVeiculoPorPlacaEOrgaoId(placa: string, orgaoId: number) {
    return this.prisma.veiculo.findFirst({
      where: {
        placa: {
          equals: placa,
          mode: 'insensitive',
        },
        orgaoId,
        ativo: true,
      },
      select: {
        id: true,
        placa: true,
        periodicidade: true,
      },
    });
  }

  /**
   * Atualiza a cota do veículo na tabela veiculo_cota_periodo
   */
  private async atualizarCotaVeiculo(
    veiculoId: number,
    quantidadePermitida: number,
    quantidadeUtilizada: number,
    periodicidade: Periodicidade | null,
  ) {
    if (!periodicidade) {
      return null;
    }

    const dataAtual = new Date();
    const { inicio, fim } = this.obterIntervaloPeriodo(dataAtual, periodicidade);

    // Buscar cota período ativo
    const cotaPeriodo = await this.prisma.veiculoCotaPeriodo.findFirst({
      where: {
        veiculoId,
        periodicidade,
        data_inicio_periodo: { lte: dataAtual },
        data_fim_periodo: { gte: dataAtual },
        ativo: true,
      },
    });

    if (!cotaPeriodo) {
      // Criar novo registro se não existir
      const quantidadeDisponivel = Math.max(
        quantidadePermitida - quantidadeUtilizada,
        0,
      );

      return this.prisma.veiculoCotaPeriodo.create({
        data: {
          veiculoId,
          periodicidade,
          data_inicio_periodo: inicio,
          data_fim_periodo: fim,
          quantidade_permitida: new Decimal(quantidadePermitida),
          quantidade_utilizada: new Decimal(quantidadeUtilizada),
          quantidade_disponivel: new Decimal(quantidadeDisponivel),
          ativo: true,
        },
      });
    }

    // Atualizar registro existente
    const quantidadeDisponivel = Math.max(
      quantidadePermitida - quantidadeUtilizada,
      0,
    );

    return this.prisma.veiculoCotaPeriodo.update({
      where: { id: cotaPeriodo.id },
      data: {
        quantidade_permitida: new Decimal(quantidadePermitida),
        quantidade_utilizada: new Decimal(quantidadeUtilizada),
        quantidade_disponivel: new Decimal(quantidadeDisponivel),
      },
    });
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

