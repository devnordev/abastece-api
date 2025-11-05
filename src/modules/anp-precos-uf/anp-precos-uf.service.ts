import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AnpBase, Prisma, UF, TipoCombustivelAnp } from '@prisma/client';

@Injectable()
export class AnpPrecosUfService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula o teto_calculado para todos os registros de ANPPrecosUf
   * baseado no parâmetro de teto fornecido
   * 
   * @param anpBase - Base ANP a ser utilizada (MINIMO, MEDIO, MAXIMO)
   * @param margemPct - Margem percentual a ser aplicada (ex: 1.0 para 1%)
   */
  async calcularTetoPrecos(anpBase: AnpBase, margemPct: number | null): Promise<void> {
    if (margemPct === null || margemPct === undefined) {
      return;
    }

    // Buscar todos os registros de preços ANP
    const precosAnp = await this.prisma.anpPrecosUf.findMany();

    // Calcular o fator de multiplicação (1 + margem_pct/100)
    const fatorMultiplicacao = 1 + Number(margemPct) / 100;
    const margemDecimal = new Prisma.Decimal(margemPct);

    // Usar transação com callback para garantir tipo correto
    await this.prisma.$transaction(async (tx) => {
      for (const preco of precosAnp) {
        let precoBase: Prisma.Decimal | null = null;

        // Selecionar o preço base de acordo com anp_base
        switch (anpBase) {
          case AnpBase.MINIMO:
            precoBase = preco.preco_minimo;
            break;
          case AnpBase.MEDIO:
            precoBase = preco.preco_medio;
            break;
          case AnpBase.MAXIMO:
            precoBase = preco.preco_maximo;
            break;
        }

        // Calcular teto_calculado apenas se o preço base existir
        if (precoBase !== null) {
          const tetoCalculado = new Prisma.Decimal(Number(precoBase) * fatorMultiplicacao);

          await tx.anpPrecosUf.update({
            where: { id: preco.id },
            data: {
              teto_calculado: tetoCalculado,
              base_utilizada: anpBase,
              margem_aplicada: margemDecimal,
            },
          });
        }
      }
    });
  }

  /**
   * Busca todos os preços ANP por UF
   */
  async findAll() {
    const precos = await this.prisma.anpPrecosUf.findMany({
      include: {
        anpSemana: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return {
      message: 'Preços ANP por UF encontrados com sucesso',
      precos,
      total: precos.length,
    };
  }

  /**
   * Busca um preço ANP por ID
   */
  async findOne(id: number) {
    const preco = await this.prisma.anpPrecosUf.findUnique({
      where: { id },
      include: {
        anpSemana: true,
      },
    });

    if (!preco) {
      throw new NotFoundException('Preço ANP não encontrado. Verifique se o ID informado está correto.');
    }

    return {
      message: 'Preço ANP encontrado com sucesso',
      preco,
    };
  }

  /**
   * Busca preços por semana ANP
   */
  async findBySemana(anpSemanaId: number) {
    const precos = await this.prisma.anpPrecosUf.findMany({
      where: {
        anp_semana_id: anpSemanaId,
      },
      include: {
        anpSemana: true,
      },
      orderBy: {
        uf: 'asc',
      },
    });

    return {
      message: 'Preços ANP encontrados para a semana',
      precos,
      total: precos.length,
    };
  }

  /**
   * Mapeia nome do estado para enum UF
   */
  private mapearEstadoParaUF(estado: string): UF | null {
    const estadoMap: Record<string, UF> = {
      // Formato com acentos e minúsculas
      'Acre': UF.AC,
      'Alagoas': UF.AL,
      'Amapá': UF.AP,
      'Amazonas': UF.AM,
      'Bahia': UF.BA,
      'Ceará': UF.CE,
      'Distrito Federal': UF.DF,
      'Espírito Santo': UF.ES,
      'Goiás': UF.GO,
      'Maranhão': UF.MA,
      'Mato Grosso': UF.MT,
      'Mato Grosso do Sul': UF.MS,
      'Minas Gerais': UF.MG,
      'Pará': UF.PA,
      'Paraíba': UF.PB,
      'Paraná': UF.PR,
      'Pernambuco': UF.PE,
      'Piauí': UF.PI,
      'Rio de Janeiro': UF.RJ,
      'Rio Grande do Norte': UF.RN,
      'Rio Grande do Sul': UF.RS,
      'Rondônia': UF.RO,
      'Roraima': UF.RR,
      'Santa Catarina': UF.SC,
      'São Paulo': UF.SP,
      'Sergipe': UF.SE,
      'Tocantins': UF.TO,
      // Formato ANP (MAIÚSCULAS)
      'ACRE': UF.AC,
      'ALAGOAS': UF.AL,
      'AMAPÁ': UF.AP,
      'AMAPA': UF.AP,
      'AMAZONAS': UF.AM,
      'BAHIA': UF.BA,
      'CEARÁ': UF.CE,
      'CEARA': UF.CE,
      'DISTRITO FEDERAL': UF.DF,
      'ESPÍRITO SANTO': UF.ES,
      'ESPIRITO SANTO': UF.ES,
      'GOIÁS': UF.GO,
      'GOIAS': UF.GO,
      'MARANHÃO': UF.MA,
      'MARANHAO': UF.MA,
      'MATO GROSSO': UF.MT,
      'MATO GROSSO DO SUL': UF.MS,
      'MINAS GERAIS': UF.MG,
      'PARÁ': UF.PA,
      'PARA': UF.PA,
      'PARAÍBA': UF.PB,
      'PARAIBA': UF.PB,
      'PARANÁ': UF.PR,
      'PARANA': UF.PR,
      'PERNAMBUCO': UF.PE,
      'PIAUÍ': UF.PI,
      'PIAUI': UF.PI,
      'RIO DE JANEIRO': UF.RJ,
      'RIO GRANDE DO NORTE': UF.RN,
      'RIO GRANDE DO SUL': UF.RS,
      'RONDÔNIA': UF.RO,
      'RONDONIA': UF.RO,
      'RORAIMA': UF.RR,
      'SANTA CATARINA': UF.SC,
      'SÃO PAULO': UF.SP,
      'SAO PAULO': UF.SP,
      'SERGIPE': UF.SE,
      'TOCANTINS': UF.TO,
    };

    // Tenta encontrar por nome completo ou sigla
    const estadoNormalizado = estado.trim();
    if (estadoMap[estadoNormalizado]) {
      return estadoMap[estadoNormalizado];
    }

    // Tenta por sigla (2 letras)
    if (estadoNormalizado.length === 2) {
      const sigla = estadoNormalizado.toUpperCase();
      if (Object.values(UF).includes(sigla as UF)) {
        return sigla as UF;
      }
    }

    return null;
  }

  /**
   * Mapeia nome do produto para enum TipoCombustivelAnp
   */
  private mapearProdutoParaCombustivel(produto: string): TipoCombustivelAnp | null {
    const produtoLower = produto.toLowerCase().trim();
    const produtoUpper = produto.toUpperCase().trim();
    
    const produtoMap: Record<string, TipoCombustivelAnp> = {
      // Formato minúsculas
      'gasolina comum': TipoCombustivelAnp.GASOLINA_COMUM,
      'gasolina aditivada': TipoCombustivelAnp.GASOLINA_ADITIVADA,
      'etanol comum': TipoCombustivelAnp.ETANOL_COMUM,
      'etanol aditivado': TipoCombustivelAnp.ETANOL_ADITIVADO,
      'diesel s10': TipoCombustivelAnp.DIESEL_S10,
      'diesel s500': TipoCombustivelAnp.DIESEL_S500,
      'óleo diesel': TipoCombustivelAnp.DIESEL_S500,
      'oleo diesel': TipoCombustivelAnp.DIESEL_S500,
      'gnv': TipoCombustivelAnp.GNV,
      'glp': TipoCombustivelAnp.GLP,
      // Formato ANP (MAIÚSCULAS)
      'GASOLINA COMUM': TipoCombustivelAnp.GASOLINA_COMUM,
      'GASOLINA ADITIVADA': TipoCombustivelAnp.GASOLINA_ADITIVADA,
      'ETANOL HIDRATADO': TipoCombustivelAnp.ETANOL_COMUM,
      'ETANOL COMUM': TipoCombustivelAnp.ETANOL_COMUM,
      'ETANOL ADITIVADO': TipoCombustivelAnp.ETANOL_ADITIVADO,
      'OLEO DIESEL S10': TipoCombustivelAnp.DIESEL_S10,
      'ÓLEO DIESEL S10': TipoCombustivelAnp.DIESEL_S10,
      'OLEO DIESEL': TipoCombustivelAnp.DIESEL_S500,
      'ÓLEO DIESEL': TipoCombustivelAnp.DIESEL_S500,
      'DIESEL S10': TipoCombustivelAnp.DIESEL_S10,
      'DIESEL S500': TipoCombustivelAnp.DIESEL_S500,
      'GNV': TipoCombustivelAnp.GNV,
      'GLP': TipoCombustivelAnp.GLP,
    };

    // Tenta encontrar mapeamento direto
    if (produtoMap[produtoLower]) {
      return produtoMap[produtoLower];
    }
    if (produtoMap[produtoUpper]) {
      return produtoMap[produtoUpper];
    }
    if (produtoMap[produto]) {
      return produtoMap[produto];
    }

    // Busca parcial (case-insensitive)
    for (const [key, value] of Object.entries(produtoMap)) {
      const keyLower = key.toLowerCase();
      if (produtoLower.includes(keyLower) || keyLower.includes(produtoLower)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Busca o parâmetro de teto ativo
   */
  private async buscarParametroTetoAtivo() {
    const parametroTeto = await this.prisma.parametrosTeto.findFirst({
      where: {
        ativo: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!parametroTeto) {
      throw new NotFoundException('Nenhum parâmetro de teto ativo encontrado. Cadastre e ative um parâmetro de teto antes de importar os preços ANP.');
    }

    if (!parametroTeto.margem_pct) {
      throw new BadRequestException('O parâmetro de teto ativo não possui margem percentual definida. Configure a margem percentual (entre 0 e 100) no parâmetro de teto antes de importar os preços.');
    }

    return parametroTeto;
  }

  /**
   * Calcula o teto_calculado baseado no preço base e margem
   */
  private calcularTeto(precoBase: number, margemPct: number): Prisma.Decimal {
    const fatorMultiplicacao = 1 + Number(margemPct) / 100;
    return new Prisma.Decimal(precoBase * fatorMultiplicacao);
  }

  /**
   * Importa preços ANP a partir de um arquivo CSV
   */
  async importarPrecosCSV(anpSemanaId: number, csvContent: string): Promise<any> {
    // Verificar se a semana ANP existe
    const anpSemana = await this.prisma.anpSemana.findUnique({
      where: { id: anpSemanaId },
    });

    if (!anpSemana) {
      throw new NotFoundException(`Semana ANP com ID ${anpSemanaId} não encontrada. Verifique se o ID informado está correto e se a semana foi cadastrada anteriormente.`);
    }

    // Buscar parâmetro de teto ativo
    const parametroTeto = await this.buscarParametroTetoAtivo();
    const anpBase = parametroTeto.anp_base;
    const margemPct = Number(parametroTeto.margem_pct);

    // Parsear CSV - função auxiliar para fazer parse correto considerando aspas e ponto e vírgula
    const parseCSVLine = (line: string, separator: string = ';'): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escape de aspas duplas
            current += '"';
            i++; // Pular próximo caractere
          } else {
            // Toggle de aspas
            inQuotes = !inQuotes;
          }
        } else if (char === separator && !inQuotes) {
          // Separador de campo (ponto e vírgula ou vírgula)
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Adicionar último campo
      result.push(current.trim());
      return result;
    };

    const linhas = csvContent.split('\n').filter(linha => linha.trim());
    if (linhas.length < 2) {
      throw new BadRequestException('O arquivo CSV está vazio ou incompleto. O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
    }

    // Detectar separador (ponto e vírgula ou vírgula)
    const primeiraLinhaComDados = linhas.find(linha => linha.includes(';') || linha.includes(','));
    const usaPontoEVirgula = primeiraLinhaComDados?.includes(';') || false;
    const separator = usaPontoEVirgula ? ';' : ',';

    // Função auxiliar para normalizar texto e lidar com problemas de encoding
    const normalizarTexto = (texto: string): string => {
      return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .trim();
    };

    // Função auxiliar para verificar se uma coluna corresponde a um padrão
    const correspondePadrao = (coluna: string, padroes: string[]): boolean => {
      const colunaNormalizada = normalizarTexto(coluna);
      return padroes.some(padrao => {
        const padraoNormalizado = normalizarTexto(padrao);
        return colunaNormalizada.includes(padraoNormalizado) || 
               padraoNormalizado.includes(colunaNormalizada) ||
               colunaNormalizada === padraoNormalizado;
      });
    };

    // Estratégia: Sempre usar a linha 10 (índice 9) como cabeçalho, conforme informado pelo usuário
    // O formato ANP sempre tem o cabeçalho na linha 10
    let indiceCabecalho = -1;
    
    // Primeiro: tentar usar a linha 10 diretamente (índice 9)
    // Se a linha 10 tem pelo menos 8 colunas, assume que é o cabeçalho
    if (linhas.length > 9) {
      const linha10 = linhas[9].trim();
      if (linha10 && linha10.length > 20) {
        const colunas = parseCSVLine(linha10, separator).map(col => 
          col.replace(/^"|"$/g, '').trim()
        );
        
        // Se tem pelo menos 8 colunas, assume que é o cabeçalho (formato ANP)
        if (colunas.length >= 8) {
          indiceCabecalho = 9;
        }
      }
    }
    
    // Se não encontrou na linha 10, procurar nas linhas 10-20 (pulando linhas 1-9)
    if (indiceCabecalho === -1) {
      for (let i = 9; i < Math.min(20, linhas.length); i++) {
        const linha = linhas[i].trim();
        if (!linha || linha.length < 10) continue;
        
        // Fazer parse da linha para verificar as colunas
        const colunas = parseCSVLine(linha, separator).map(col => 
          col.replace(/^"|"$/g, '').trim()
        );
        
        // Verificar se tem pelo menos 8 colunas (cabeçalho ANP tem muitas colunas)
        if (colunas.length < 8) continue;
        
        // Normalizar colunas para comparação
        const colunasNormalizadas = colunas.map(col => normalizarTexto(col));
        
        // Verificar se tem "ESTADOS" e "PRODUTO" como colunas separadas
        const temEstados = colunasNormalizadas.some(col => 
          correspondePadrao(col, ['estados', 'estado', 'uf'])
        );
        const temProduto = colunasNormalizadas.some(col => 
          correspondePadrao(col, ['produto', 'combustivel'])
        );
        const temPrecoMedio = colunasNormalizadas.some(col => 
          correspondePadrao(col, ['preco medio', 'preço médio', 'medio', 'médio', 'preco medio revenda', 'preço médio revenda'])
        );
        
        // Se tem os três campos essenciais, encontramos o cabeçalho
        if (temEstados && temProduto && temPrecoMedio) {
          indiceCabecalho = i;
          break;
        }
      }
    }
    
    // Última tentativa: usar linha 10 mesmo sem validação rigorosa
    // (assumindo que o usuário sabe que é a linha 10)
    if (indiceCabecalho === -1 && linhas.length > 9) {
      const linha10 = linhas[9].trim();
      if (linha10 && parseCSVLine(linha10, separator).length >= 8) {
        indiceCabecalho = 9;
      }
    }

    if (indiceCabecalho === -1) {
      // Debug: mostrar as primeiras linhas para ajudar no diagnóstico
      const primeirasLinhas = linhas.slice(0, 12).map((l, i) => {
        const colunas = parseCSVLine(l, separator);
        return `Linha ${i + 1} (${colunas.length} colunas): ${l.substring(0, 150)}`;
      }).join('\n');
      
      throw new BadRequestException(
        `Não foi possível encontrar o cabeçalho do CSV na linha 10. Verifique se o arquivo está no formato correto da ANP e contém as colunas obrigatórias: ESTADOS, PRODUTO, PREÇO MÉDIO REVENDA.\n\n` +
        `Primeiras linhas do arquivo para análise:\n${primeirasLinhas}`
      );
    }

    // Extrair cabeçalho
    const cabecalho = parseCSVLine(linhas[indiceCabecalho], separator).map(col => 
      col.replace(/^"|"$/g, '').trim()
    );
    
    // Normalizar cabeçalho para comparação (lidar com encoding)
    const cabecalhoNormalizado = cabecalho.map(col => normalizarTexto(col));
    
    // Função auxiliar para encontrar coluna mesmo com problemas de encoding
    const encontrarColuna = (padroes: string[]): number => {
      // Primeiro tenta encontrar exatamente
      for (let i = 0; i < cabecalhoNormalizado.length; i++) {
        const col = cabecalhoNormalizado[i];
        const colOriginal = cabecalho[i].toLowerCase();
        
        for (const padrao of padroes) {
          const padraoNormalizado = normalizarTexto(padrao);
          const padraoLower = padrao.toLowerCase();
          
          // Verifica se a coluna contém o padrão ou o padrão contém a coluna
          if (col.includes(padraoNormalizado) || padraoNormalizado.includes(col) ||
              colOriginal.includes(padraoLower) || padraoLower.includes(colOriginal)) {
            return i;
          }
          
          // Busca por partes da palavra (para lidar com encoding quebrado)
          const partesPadrao = padraoNormalizado.split(' ').filter(p => p.length > 2);
          if (partesPadrao.length > 0) {
            const todasPartes = partesPadrao.every(parte => col.includes(parte) || colOriginal.includes(parte.toLowerCase()));
            if (todasPartes) {
              return i;
            }
          }
        }
      }
      return -1;
    };
    
    // Encontrar índices das colunas usando busca flexível
    const indiceEstados = encontrarColuna(['estados', 'estado', 'uf']);
    const indiceProduto = encontrarColuna(['produto', 'combustivel', 'combustível']);
    
    // Para preço médio, buscar por palavras-chave separadas (encoding pode quebrar)
    let indicePrecoMedio = encontrarColuna([
      'preco medio revenda', 
      'preço médio revenda',
      'preco medio',
      'preço médio',
      'medio revenda',
      'médio revenda'
    ]);
    
    // Se não encontrou, busca por palavras-chave separadas
    if (indicePrecoMedio === -1) {
      for (let i = 0; i < cabecalhoNormalizado.length; i++) {
        const col = cabecalhoNormalizado[i];
        const colOriginal = cabecalho[i].toLowerCase();
        // Verifica se tem "medio" ou "médio" E "revenda" (mesmo com encoding quebrado)
        const temMedio = col.includes('medio') || col.includes('médio') || 
                         colOriginal.includes('medio') || colOriginal.includes('médio') ||
                         col.includes('mdio'); // Para encoding quebrado "mdio"
        const temRevenda = col.includes('revenda') || colOriginal.includes('revenda');
        const temPreco = col.includes('preco') || col.includes('preço') || 
                         colOriginal.includes('preco') || colOriginal.includes('preço') ||
                         col.includes('preo'); // Para encoding quebrado "preo"
        
        if ((temMedio && temRevenda) || (temPreco && temMedio)) {
          indicePrecoMedio = i;
          break;
        }
      }
    }
    
    // Para preço mínimo
    let indicePrecoMinimo = encontrarColuna([
      'preco minimo revenda',
      'preço mínimo revenda',
      'preco minimo',
      'preço mínimo',
      'minimo revenda',
      'mínimo revenda'
    ]);
    
    if (indicePrecoMinimo === -1) {
      for (let i = 0; i < cabecalhoNormalizado.length; i++) {
        const col = cabecalhoNormalizado[i];
        const colOriginal = cabecalho[i].toLowerCase();
        const temMinimo = col.includes('minimo') || col.includes('mínimo') || 
                         colOriginal.includes('minimo') || colOriginal.includes('mínimo') ||
                         col.includes('mnimo'); // Para encoding quebrado
        const temRevenda = col.includes('revenda') || colOriginal.includes('revenda');
        const temPreco = col.includes('preco') || col.includes('preço') || 
                         colOriginal.includes('preco') || colOriginal.includes('preço') ||
                         col.includes('preo');
        
        if ((temMinimo && temRevenda) || (temPreco && temMinimo)) {
          indicePrecoMinimo = i;
          break;
        }
      }
    }
    
    // Para preço máximo
    let indicePrecoMaximo = encontrarColuna([
      'preco maximo revenda',
      'preço máximo revenda',
      'preco maximo',
      'preço máximo',
      'maximo revenda',
      'máximo revenda'
    ]);
    
    if (indicePrecoMaximo === -1) {
      for (let i = 0; i < cabecalhoNormalizado.length; i++) {
        const col = cabecalhoNormalizado[i];
        const colOriginal = cabecalho[i].toLowerCase();
        const temMaximo = col.includes('maximo') || col.includes('máximo') || 
                         colOriginal.includes('maximo') || colOriginal.includes('máximo') ||
                         col.includes('mximo'); // Para encoding quebrado
        const temRevenda = col.includes('revenda') || colOriginal.includes('revenda');
        const temPreco = col.includes('preco') || col.includes('preço') || 
                         colOriginal.includes('preco') || colOriginal.includes('preço') ||
                         col.includes('preo');
        
        if ((temMaximo && temRevenda) || (temPreco && temMaximo)) {
          indicePrecoMaximo = i;
          break;
        }
      }
    }

    if (indiceEstados === -1 || indiceProduto === -1 || indicePrecoMedio === -1) {
      const colunasFaltantes = [];
      if (indiceEstados === -1) colunasFaltantes.push('ESTADOS/UF');
      if (indiceProduto === -1) colunasFaltantes.push('PRODUTO/COMBUSTÍVEL');
      if (indicePrecoMedio === -1) colunasFaltantes.push('PREÇO MÉDIO REVENDA');
      
      throw new BadRequestException(
        `O arquivo CSV não contém todas as colunas obrigatórias. Colunas faltantes: ${colunasFaltantes.join(', ')}. ` +
        `Colunas encontradas no arquivo: ${cabecalho.join(', ')}. Verifique se o arquivo está no formato correto da ANP.`
      );
    }

    const dadosParaSalvar: any[] = [];
    const erros: string[] = [];

    // Processar cada linha de dados (pula o cabeçalho)
    for (let i = indiceCabecalho + 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha || linha.startsWith(';') || linha === '') continue;

      const valores = parseCSVLine(linha, separator).map(val => val.replace(/^"|"$/g, '').trim());

      try {
        const estado = valores[indiceEstados];
        const produto = valores[indiceProduto];
        const precoMedio = parseFloat(valores[indicePrecoMedio]?.replace(',', '.') || '0');
        const precoMinimo = indicePrecoMinimo !== -1 ? parseFloat(valores[indicePrecoMinimo]?.replace(',', '.') || '0') : null;
        const precoMaximo = indicePrecoMaximo !== -1 ? parseFloat(valores[indicePrecoMaximo]?.replace(',', '.') || '0') : null;

        // Validar e mapear estado
        const uf = this.mapearEstadoParaUF(estado);
        if (!uf) {
          erros.push(`Linha ${i + 1} (linha ${i + 1 + indiceCabecalho} do arquivo): Estado "${estado}" não reconhecido. Verifique se o nome do estado está correto ou use a sigla da UF (ex: SP, RJ, MG).`);
          continue;
        }

        // Validar e mapear produto
        const combustivel = this.mapearProdutoParaCombustivel(produto);
        if (!combustivel) {
          erros.push(`Linha ${i + 1} (linha ${i + 1 + indiceCabecalho} do arquivo): Produto "${produto}" não reconhecido. Verifique se o nome do combustível está correto (ex: Gasolina Comum, Etanol, Diesel S10).`);
          continue;
        }

        // Validar preço médio
        if (isNaN(precoMedio) || precoMedio <= 0) {
          erros.push(`Linha ${i + 1} (linha ${i + 1 + indiceCabecalho} do arquivo): Preço médio inválido. O valor deve ser um número maior que zero.`);
          continue;
        }

        // Selecionar preço base conforme anp_base
        let precoBase: number;
        switch (anpBase) {
          case AnpBase.MINIMO:
            precoBase = precoMinimo && !isNaN(precoMinimo) && precoMinimo > 0 ? precoMinimo : precoMedio;
            break;
          case AnpBase.MEDIO:
            precoBase = precoMedio;
            break;
          case AnpBase.MAXIMO:
            precoBase = precoMaximo && !isNaN(precoMaximo) && precoMaximo > 0 ? precoMaximo : precoMedio;
            break;
        }

        // Calcular teto
        const tetoCalculado = this.calcularTeto(precoBase, margemPct);

        dadosParaSalvar.push({
          anp_semana_id: anpSemanaId,
          uf,
          combustivel,
          preco_minimo: precoMinimo && !isNaN(precoMinimo) && precoMinimo > 0 ? new Prisma.Decimal(precoMinimo) : null,
          preco_medio: new Prisma.Decimal(precoMedio),
          preco_maximo: precoMaximo && !isNaN(precoMaximo) && precoMaximo > 0 ? new Prisma.Decimal(precoMaximo) : null,
          teto_calculado: tetoCalculado,
          base_utilizada: anpBase,
          margem_aplicada: new Prisma.Decimal(margemPct),
        });
      } catch (error) {
        erros.push(`Linha ${i + 1} (linha ${i + 1 + indiceCabecalho} do arquivo): ${error.message}`);
      }
    }

    if (dadosParaSalvar.length === 0) {
      const mensagemErros = erros.length > 0 
        ? `\n\nErros encontrados:\n${erros.slice(0, 10).join('\n')}${erros.length > 10 ? `\n... e mais ${erros.length - 10} erro(s)` : ''}`
        : '';
      throw new BadRequestException(
        `Nenhum dado válido encontrado no CSV. Verifique se o arquivo está no formato correto da ANP e se todas as colunas obrigatórias estão presentes.${mensagemErros}`
      );
    }

    // Salvar em lote usando transação
    const resultado = await this.prisma.$transaction(async (tx) => {
      const criados = [];
      for (const dados of dadosParaSalvar) {
        const criado = await tx.anpPrecosUf.create({ data: dados });
        criados.push(criado);
      }
      return criados;
    });

    return {
      message: `${resultado.length} preços importados com sucesso`,
      total: resultado.length,
      erros: erros.length > 0 ? erros : undefined,
    };
  }
}

