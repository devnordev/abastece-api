import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Script para gerar backup do banco de dados
 * 
 * Uso:
 *   npm run prisma:seed:backup
 *   ou
 *   ts-node prisma/seed-backup.ts
 * 
 * Opções:
 *   - Backup completo: gerado automaticamente
 *   - Backup por prefeitura: passe --prefeitura-id=<id>
 *   - Backup por empresa: passe --empresa-id=<id>
 */

interface BackupOptions {
  prefeituraId?: number;
  empresaId?: number;
  fullBackup?: boolean;
}

async function getTimestamp(): Promise<string> {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}-${hours}${minutes}${seconds}`;
}

async function generateFullBackup(): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = await getTimestamp();
  const filename = `backup_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  try {
    let sqlContent = `-- ============================================
-- BACKUP COMPLETO DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Tipo: Backup Completo
-- Gerado via: seed-backup.ts
-- ============================================

`;

    // Buscar todas as tabelas principais usando Prisma
    console.log('📊 Buscando dados do banco...');

    const prefeituras = await prisma.prefeitura.findMany();
    if (prefeituras.length > 0) {
      sqlContent += generateInsertSQL('prefeitura', prefeituras);
    }

    const empresas = await prisma.empresa.findMany();
    if (empresas.length > 0) {
      sqlContent += generateInsertSQL('empresa', empresas);
    }

    const usuarios = await prisma.usuario.findMany();
    if (usuarios.length > 0) {
      sqlContent += generateInsertSQL('usuario', usuarios);
    }

    const orgaos = await prisma.orgao.findMany();
    if (orgaos.length > 0) {
      sqlContent += generateInsertSQL('orgao', orgaos);
    }

    const veiculos = await prisma.veiculo.findMany();
    if (veiculos.length > 0) {
      sqlContent += generateInsertSQL('veiculo', veiculos);
    }

    const motoristas = await prisma.motorista.findMany();
    if (motoristas.length > 0) {
      sqlContent += generateInsertSQL('motorista', motoristas);
    }

    const categorias = await prisma.categoria.findMany();
    if (categorias.length > 0) {
      sqlContent += generateInsertSQL('categoria', categorias);
    }

    const combustiveis = await prisma.combustivel.findMany();
    if (combustiveis.length > 0) {
      sqlContent += generateInsertSQL('combustivel', combustiveis);
    }

    const contratos = await prisma.contrato.findMany();
    if (contratos.length > 0) {
      sqlContent += generateInsertSQL('contrato', contratos);
    }

    const processos = await prisma.processo.findMany();
    if (processos.length > 0) {
      sqlContent += generateInsertSQL('processo', processos);
    }

    const abastecimentos = await prisma.abastecimento.findMany();
    if (abastecimentos.length > 0) {
      sqlContent += generateInsertSQL('abastecimento', abastecimentos);
    }

    const cotasOrgao = await prisma.cotaOrgao.findMany();
    if (cotasOrgao.length > 0) {
      sqlContent += generateInsertSQL('cota_orgao', cotasOrgao);
    }

    const contasFaturamento = await prisma.contaFaturamentoOrgao.findMany();
    if (contasFaturamento.length > 0) {
      sqlContent += generateInsertSQL('conta_faturamento_orgao', contasFaturamento);
    }

    const processoCombustiveis = await prisma.processoCombustivel.findMany();
    if (processoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('processo_combustivel', processoCombustiveis);
    }

    const processoCombustiveisConsorciado = await prisma.processoCombustivelConsorciado.findMany();
    if (processoCombustiveisConsorciado.length > 0) {
      sqlContent += generateInsertSQL('processo_combustivel_consorciado', processoCombustiveisConsorciado);
    }

    const prefeiturasConsorcio = await prisma.processoPrefeituraConsorcio.findMany();
    if (prefeiturasConsorcio.length > 0) {
      sqlContent += generateInsertSQL('processo_prefeitura_consorcio', prefeiturasConsorcio);
    }

    const prefeiturasCombustiveisConsorcio = await prisma.processoPrefeituraCombustivelConsorcio.findMany();
    if (prefeiturasCombustiveisConsorcio.length > 0) {
      sqlContent += generateInsertSQL('processo_prefeitura_combustivel_consorcio', prefeiturasCombustiveisConsorcio);
    }

    const aditivosContrato = await prisma.aditivoContrato.findMany();
    if (aditivosContrato.length > 0) {
      sqlContent += generateInsertSQL('aditivo_contrato', aditivosContrato);
    }

    const aditivosProcesso = await prisma.aditivoProcesso.findMany();
    if (aditivosProcesso.length > 0) {
      sqlContent += generateInsertSQL('aditivo_processo', aditivosProcesso);
    }

    const empresaPrecoCombustivel = await prisma.empresaPrecoCombustivel.findMany();
    if (empresaPrecoCombustivel.length > 0) {
      sqlContent += generateInsertSQL('empresa_preco_combustivel', empresaPrecoCombustivel);
    }

    const anpSemana = await prisma.anpSemana.findMany();
    if (anpSemana.length > 0) {
      sqlContent += generateInsertSQL('anp_semana', anpSemana);
    }

    const anpPrecosUf = await prisma.anpPrecosUf.findMany();
    if (anpPrecosUf.length > 0) {
      sqlContent += generateInsertSQL('anp_precos_uf', anpPrecosUf);
    }

    const parametrosTeto = await prisma.parametrosTeto.findMany();
    if (parametrosTeto.length > 0) {
      sqlContent += generateInsertSQL('parametros_teto', parametrosTeto);
    }

    const notificacoes = await prisma.notificacao.findMany();
    if (notificacoes.length > 0) {
      sqlContent += generateInsertSQL('notificacao', notificacoes);
    }

    const onOff = await prisma.onOff.findMany();
    if (onOff.length > 0) {
      sqlContent += generateInsertSQL('onoff', onOff);
    }

    const onOffApp = await prisma.onOffApp.findMany();
    if (onOffApp.length > 0) {
      sqlContent += generateInsertSQL('onoffapp', onOffApp);
    }

    const logsAlteracoes = await prisma.logsAlteracoes.findMany();
    if (logsAlteracoes.length > 0) {
      sqlContent += generateInsertSQL('logs_alteracoes', logsAlteracoes);
    }

    const refreshTokens = await prisma.refreshToken.findMany();
    if (refreshTokens.length > 0) {
      sqlContent += generateInsertSQL('refresh_token', refreshTokens);
    }

    const solicitacoesAbastecimento = await prisma.solicitacaoAbastecimento.findMany();
    if (solicitacoesAbastecimento.length > 0) {
      sqlContent += generateInsertSQL('solicitacoes_abastecimento', solicitacoesAbastecimento);
    }

    const veiculoCotaPeriodos = await prisma.veiculoCotaPeriodo.findMany();
    if (veiculoCotaPeriodos.length > 0) {
      sqlContent += generateInsertSQL('veiculo_cota_periodo', veiculoCotaPeriodos);
    }

    // Tabelas de relacionamento Many-to-Many
    const contratoCombustiveis = await prisma.contratoCombustivel.findMany();
    if (contratoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('contrato_combustivel', contratoCombustiveis);
    }

    const veiculoCombustiveis = await prisma.veiculoCombustivel.findMany();
    if (veiculoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('veiculo_combustivel', veiculoCombustiveis);
    }

    const veiculoCategorias = await prisma.veiculoCategoria.findMany();
    if (veiculoCategorias.length > 0) {
      sqlContent += generateInsertSQL('veiculo_categoria', veiculoCategorias);
    }

    const veiculoMotoristas = await prisma.veiculoMotorista.findMany();
    if (veiculoMotoristas.length > 0) {
      sqlContent += generateInsertSQL('veiculo_motorista', veiculoMotoristas);
    }

    const usuarioOrgaos = await prisma.usuarioOrgao.findMany();
    if (usuarioOrgaos.length > 0) {
      sqlContent += generateInsertSQL('usuario_orgao', usuarioOrgaos);
    }

    // Salvar arquivo
    fs.writeFileSync(filepath, sqlContent, 'utf8');

    console.log(`✅ Backup completo gerado: ${filename}`);
    console.log(`📁 Localização: ${filepath}`);
    return filename;
  } catch (error: any) {
    throw new Error(`Erro ao gerar backup: ${error?.message || error}`);
  }
}

async function generatePrefeituraBackup(prefeituraId: number): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = await getTimestamp();
  const filename = `backup_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  let sqlContent = `-- ============================================
-- BACKUP DO BANCO DE DADOS - PREFEITURA
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Prefeitura ID: ${prefeituraId}
-- Gerado via: seed-backup.ts
-- ============================================

`;

  // Buscar prefeitura
  const prefeitura = await prisma.prefeitura.findUnique({
    where: { id: prefeituraId },
  });

  if (!prefeitura) {
    throw new Error(`Prefeitura com ID ${prefeituraId} não encontrada`);
  }

  sqlContent += generateInsertSQL('prefeitura', [prefeitura]);

  // Buscar órgãos
  const orgaos = await prisma.orgao.findMany({
    where: { prefeituraId },
  });
  if (orgaos.length > 0) {
    sqlContent += generateInsertSQL('orgao', orgaos);
  }

  // Buscar veículos
  const veiculos = await prisma.veiculo.findMany({
    where: { prefeituraId },
  });
  if (veiculos.length > 0) {
    sqlContent += generateInsertSQL('veiculo', veiculos);
  }

  // Buscar motoristas
  const motoristas = await prisma.motorista.findMany({
    where: { prefeituraId },
  });
  if (motoristas.length > 0) {
    sqlContent += generateInsertSQL('motorista', motoristas);
  }

  // Buscar usuários
  const usuarios = await prisma.usuario.findMany({
    where: { prefeituraId },
  });
  if (usuarios.length > 0) {
    sqlContent += generateInsertSQL('usuario', usuarios);
  }

  // Buscar categorias
  const categorias = await prisma.categoria.findMany({
    where: { prefeituraId },
  });
  if (categorias.length > 0) {
    sqlContent += generateInsertSQL('categoria', categorias);
  }

  // Buscar processos
  const processos = await prisma.processo.findMany({
    where: { prefeituraId },
  });
  if (processos.length > 0) {
    sqlContent += generateInsertSQL('processo', processos);
  }

  // Buscar contas de faturamento
  const contasFaturamento = await prisma.contaFaturamentoOrgao.findMany({
    where: { prefeituraId },
  });
  if (contasFaturamento.length > 0) {
    sqlContent += generateInsertSQL('conta_faturamento_orgao', contasFaturamento);
  }

  // Buscar abastecimentos
  const veiculoIds = veiculos.map((v) => v.id);
  if (veiculoIds.length > 0) {
    const abastecimentos = await prisma.abastecimento.findMany({
      where: { veiculoId: { in: veiculoIds } },
    });
    if (abastecimentos.length > 0) {
      sqlContent += generateInsertSQL('abastecimento', abastecimentos);
    }
  }

  // Buscar tabelas relacionadas
  if (processos.length > 0) {
    const processoIds = processos.map((p) => p.id);
    const cotasOrgao = await prisma.cotaOrgao.findMany({
      where: { processoId: { in: processoIds } },
    });
    if (cotasOrgao.length > 0) {
      sqlContent += generateInsertSQL('cota_orgao', cotasOrgao);
    }

    const processoCombustiveis = await prisma.processoCombustivel.findMany({
      where: { processoId: { in: processoIds } },
    });
    if (processoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('processo_combustivel', processoCombustiveis);
    }
  }

  // Tabelas de relacionamento
  if (veiculos.length > 0) {
    const veiculoIds = veiculos.map((v) => v.id);
    const veiculoCategorias = await prisma.veiculoCategoria.findMany({
      where: { veiculoId: { in: veiculoIds } },
    });
    if (veiculoCategorias.length > 0) {
      sqlContent += generateInsertSQL('veiculo_categoria', veiculoCategorias);
    }

    const veiculoCombustiveis = await prisma.veiculoCombustivel.findMany({
      where: { veiculoId: { in: veiculoIds } },
    });
    if (veiculoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('veiculo_combustivel', veiculoCombustiveis);
    }

    const veiculoMotoristas = await prisma.veiculoMotorista.findMany({
      where: { veiculoId: { in: veiculoIds } },
    });
    if (veiculoMotoristas.length > 0) {
      sqlContent += generateInsertSQL('veiculo_motorista', veiculoMotoristas);
    }
  }

  fs.writeFileSync(filepath, sqlContent, 'utf8');

  console.log(`✅ Backup da prefeitura ${prefeituraId} gerado: ${filename}`);
  console.log(`📁 Localização: ${filepath}`);
  return filename;
}

async function generateEmpresaBackup(empresaId: number): Promise<string> {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = await getTimestamp();
  const filename = `backup_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);

  let sqlContent = `-- ============================================
-- BACKUP DO BANCO DE DADOS - EMPRESA
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Empresa ID: ${empresaId}
-- Gerado via: seed-backup.ts
-- ============================================

`;

  // Buscar empresa
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
  });

  if (!empresa) {
    throw new Error(`Empresa com ID ${empresaId} não encontrada`);
  }

  sqlContent += generateInsertSQL('empresa', [empresa]);

  // Buscar usuários
  const usuarios = await prisma.usuario.findMany({
    where: { empresaId },
  });
  if (usuarios.length > 0) {
    sqlContent += generateInsertSQL('usuario', usuarios);
  }

  // Buscar contratos
  const contratos = await prisma.contrato.findMany({
    where: { empresaId },
  });
  if (contratos.length > 0) {
    sqlContent += generateInsertSQL('contrato', contratos);
  }

  // Buscar tabelas relacionadas
  if (contratos.length > 0) {
    const contratoIds = contratos.map((c) => c.id);
    const contratoCombustiveis = await prisma.contratoCombustivel.findMany({
      where: { contratoId: { in: contratoIds } },
    });
    if (contratoCombustiveis.length > 0) {
      sqlContent += generateInsertSQL('contrato_combustivel', contratoCombustiveis);
    }

    const aditivosContrato = await prisma.aditivoContrato.findMany({
      where: { contratoId: { in: contratoIds } },
    });
    if (aditivosContrato.length > 0) {
      sqlContent += generateInsertSQL('aditivo_contrato', aditivosContrato);
    }
  }

  // Buscar preços de combustíveis
  const precosCombustiveis = await prisma.empresaPrecoCombustivel.findMany({
    where: { empresa_id: empresaId },
  });
  if (precosCombustiveis.length > 0) {
    sqlContent += generateInsertSQL('empresa_preco_combustivel', precosCombustiveis);
  }

  // Buscar abastecimentos
  const abastecimentos = await prisma.abastecimento.findMany({
    where: {
      OR: [
        { empresaId },
        { abastecedorId: empresaId },
      ],
    },
  });
  if (abastecimentos.length > 0) {
    sqlContent += generateInsertSQL('abastecimento', abastecimentos);
  }

  fs.writeFileSync(filepath, sqlContent, 'utf8');

  console.log(`✅ Backup da empresa ${empresaId} gerado: ${filename}`);
  console.log(`📁 Localização: ${filepath}`);
  return filename;
}

function generateInsertSQL(tableName: string, records: any[]): string {
  if (records.length === 0) return '';

  let sql = `\n-- Inserir dados na tabela ${tableName}\n`;
  sql += `-- Total de registros: ${records.length}\n\n`;

  for (const record of records) {
    const keys = Object.keys(record).filter((key) => record[key] !== undefined);
    const values = keys.map((key) => {
      const value = record[key];
      if (value === null) return 'NULL';
      if (value instanceof Date) return `'${value.toISOString()}'`;
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value;
    });

    sql += `INSERT INTO ${tableName} (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
  }

  sql += '\n';
  return sql;
}

async function main() {
  const args = process.argv.slice(2);
  const options: BackupOptions = {};

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--prefeitura-id=')) {
      options.prefeituraId = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--empresa-id=')) {
      options.empresaId = parseInt(arg.split('=')[1]);
    } else if (arg === '--full') {
      options.fullBackup = true;
    }
  }

  try {
    if (options.fullBackup || (!options.prefeituraId && !options.empresaId)) {
      console.log('🔄 Gerando backup completo...');
      await generateFullBackup();
    } else if (options.prefeituraId) {
      console.log(`🔄 Gerando backup da prefeitura ${options.prefeituraId}...`);
      await generatePrefeituraBackup(options.prefeituraId);
    } else if (options.empresaId) {
      console.log(`🔄 Gerando backup da empresa ${options.empresaId}...`);
      await generateEmpresaBackup(options.empresaId);
    }

    console.log('✅ Backup gerado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar backup:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

