import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly FULL_BACKUP_MODELS: Array<{ model: string; table: string }> = [
    { model: 'prefeitura', table: 'prefeitura' },
    { model: 'empresa', table: 'empresa' },
    { model: 'combustivel', table: 'combustivel' },
    { model: 'categoria', table: 'categoria' },
    { model: 'motorista', table: 'motorista' },
    { model: 'orgao', table: 'orgao' },
    { model: 'contaFaturamentoOrgao', table: 'conta_faturamento_orgao' },
    { model: 'veiculo', table: 'veiculo' },
    { model: 'usuario', table: 'usuario' },
    { model: 'usuarioOrgao', table: 'usuario_orgao' },
    { model: 'contrato', table: 'contrato' },
    { model: 'contratoCombustivel', table: 'contrato_combustivel' },
    { model: 'aditivoContrato', table: 'aditivo_contrato' },
    { model: 'processo', table: 'processo' },
    { model: 'processoCombustivel', table: 'processo_combustivel' },
    { model: 'processoCombustivelConsorciado', table: 'processo_combustivel_consorciado' },
    { model: 'processoPrefeituraConsorcio', table: 'processo_prefeitura_consorcio' },
    { model: 'processoPrefeituraCombustivelConsorcio', table: 'processo_prefeitura_combustivel_consorcio' },
    { model: 'aditivoProcesso', table: 'aditivo_processo' },
    { model: 'cotaOrgao', table: 'cota_orgao' },
    { model: 'veiculoCategoria', table: 'veiculo_categoria' },
    { model: 'veiculoCombustivel', table: 'veiculo_combustivel' },
    { model: 'veiculoMotorista', table: 'veiculo_motorista' },
    { model: 'veiculoCotaPeriodo', table: 'veiculo_cota_periodo' },
    { model: 'empresaPrecoCombustivel', table: 'empresa_preco_combustivel' },
    { model: 'abastecimento', table: 'abastecimento' },
    { model: 'solicitacaoAbastecimento', table: 'solicitacoes_abastecimento' },
    { model: 'anpSemana', table: 'anp_semana' },
    { model: 'anpPrecosUf', table: 'anp_precos_uf' },
    { model: 'parametrosTeto', table: 'parametros_teto' },
    { model: 'notificacao', table: 'notificacao' },
    { model: 'onOff', table: 'onoff' },
    { model: 'onOffApp', table: 'onoffapp' },
    { model: 'logsAlteracoes', table: 'logs_alteracoes' },
    { model: 'refreshToken', table: 'refresh_token' },
    { model: 'solicitacoesQrCodeVeiculo', table: 'solicitacoes_qrcode_veiculo' },
    { model: 'qrCodeMotorista', table: 'qrcode_motorista' },
  ];

  /**
   * Mapeamento de dependências das tabelas (foreign keys)
   * Define a ordem correta de execução para evitar erros de constraint
   */
  private readonly TABLE_DEPENDENCIES: Map<string, string[]> = new Map([
    // Tabelas sem dependências (podem ser executadas primeiro)
    ['prefeitura', []],
    ['empresa', []],
    ['combustivel', []],
    ['anp_semana', []],
    ['parametros_teto', []],
    ['onoff', []],
    ['onoffapp', []],
    
    // Tabelas que dependem de prefeitura
    ['orgao', ['prefeitura']],
    ['categoria', ['prefeitura']],
    ['motorista', ['prefeitura']],
    ['conta_faturamento_orgao', ['prefeitura', 'orgao']],
    ['usuario', ['prefeitura', 'empresa']],
    ['processo', ['prefeitura']],
    ['veiculo', ['prefeitura', 'orgao', 'conta_faturamento_orgao']],
    
    // Tabelas que dependem de outras
    ['usuario_orgao', ['usuario', 'orgao']],
    ['contrato', ['empresa']],
    ['contrato_combustivel', ['contrato', 'combustivel']],
    ['aditivo_contrato', ['contrato']],
    ['processo_combustivel', ['processo', 'combustivel']],
    ['processo_combustivel_consorciado', ['processo', 'combustivel']],
    ['processo_prefeitura_consorcio', ['processo', 'prefeitura']],
    ['processo_prefeitura_combustivel_consorcio', ['processo', 'prefeitura', 'combustivel']],
    ['aditivo_processo', ['processo', 'processo_combustivel']],
    ['cota_orgao', ['processo', 'orgao', 'combustivel']],
    ['veiculo_categoria', ['veiculo', 'categoria']],
    ['veiculo_combustivel', ['veiculo', 'combustivel']],
    ['veiculo_motorista', ['veiculo', 'motorista']],
    ['veiculo_cota_periodo', ['veiculo']],
    ['empresa_preco_combustivel', ['empresa', 'combustivel']],
    ['abastecimento', ['veiculo', 'motorista', 'combustivel', 'empresa', 'usuario', 'conta_faturamento_orgao', 'cota_orgao']],
    ['solicitacoes_abastecimento', ['prefeitura', 'veiculo', 'motorista', 'combustivel', 'empresa', 'abastecimento']],
    ['solicitacoes_qrcode_veiculo', ['veiculo', 'prefeitura']],
    ['qrcode_motorista', ['motorista', 'prefeitura']],
    ['anp_precos_uf', ['anp_semana']],
    ['logs_alteracoes', ['usuario']],
    ['notificacao', []],
    ['refresh_token', ['usuario']],
  ]);

  constructor(private prisma: PrismaService) {
    // Criar diretório de backups se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Ordena tabelas por dependências usando ordenação topológica
   * Garante que tabelas dependentes sejam executadas após suas dependências
   */
  private sortTablesByDependencies(tables: Array<{ model: string; table: string }>): Array<{ model: string; table: string }> {
    const tableMap = new Map<string, { model: string; table: string }>();
    tables.forEach((t) => tableMap.set(t.table, t));

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Array<{ model: string; table: string }> = [];

    const visit = (tableName: string) => {
      if (visiting.has(tableName)) {
        // Ciclo detectado, mas continuamos (pode ser dependência circular opcional)
        return;
      }
      if (visited.has(tableName)) {
        return;
      }

      visiting.add(tableName);
      const dependencies = this.TABLE_DEPENDENCIES.get(tableName) || [];
      
      // Visitar dependências primeiro
      for (const dep of dependencies) {
        if (tableMap.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(tableName);
      visited.add(tableName);

      // Adicionar à lista ordenada
      if (tableMap.has(tableName) && !result.find((t) => t.table === tableName)) {
        result.push(tableMap.get(tableName)!);
      }
    };

    // Visitar todas as tabelas
    tables.forEach((t) => visit(t.table));

    // Adicionar tabelas que não estão no mapeamento de dependências
    tables.forEach((t) => {
      if (!visited.has(t.table)) {
        result.push(t);
      }
    });

    return result;
  }

  /**
   * Gera backup completo do banco de dados (apenas SUPER_ADMIN)
   * Agora com ordenação correta das tabelas
   */
  async generateFullBackup(): Promise<string> {
    const timestamp = this.getTimestamp();
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Ordenar tabelas por dependências
      const orderedTables = this.sortTablesByDependencies(this.FULL_BACKUP_MODELS);

      let sqlContent = `-- ============================================
-- BACKUP COMPLETO DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Tipo: Backup Completo
-- Gerado via: API Backup Service
-- Ordem de execução: Tabelas ordenadas por dependências
-- ============================================

`;
      for (const { model, table } of orderedTables) {
        const records = await this.fetchAllRecords(model);
        if (records.length > 0) {
          sqlContent += this.generateInsertSQL(table, records);
        }
      }

      // Salvar arquivo
      fs.writeFileSync(filepath, sqlContent, 'utf8');

      return filename;
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar backup: ${error.message}`);
    }
  }

  /**
   * Gera backup filtrado por perfil de usuário
   * Agora com ordenação correta das tabelas para garantir restauração sem erros
   */
  async generateBackupByUser(user: any): Promise<string> {
    const timestamp = this.getTimestamp();
    let filename: string;

    // Determinar tipo de backup baseado no perfil
    if (user.tipo_usuario === 'SUPER_ADMIN') {
      return this.generateFullBackup();
    }

    // Coletar todas as tabelas e dados primeiro
    const tablesData: Array<{ table: string; records: any[] }> = [];

    // Cabeçalho do backup
    const header = `-- ============================================
-- BACKUP DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Perfil: ${user.tipo_usuario}
-- Usuário: ${user.nome} (${user.email})
-- Ordem de execução: Tabelas ordenadas por dependências
`;

    if (user.tipo_usuario === 'ADMIN_PREFEITURA' || user.tipo_usuario === 'COLABORADOR_PREFEITURA') {
      if (!user.prefeituraId) {
        throw new BadRequestException('Usuário não está vinculado a uma prefeitura');
      }

      filename = `backup_${timestamp}.sql`;

      // Buscar dados da prefeitura
      const prefeitura = await this.prisma.prefeitura.findUnique({
        where: { id: user.prefeituraId },
      });

      if (!prefeitura) {
        throw new NotFoundException('Prefeitura não encontrada');
      }

      filename = `backup_${timestamp}.sql`;
      
      // Coletar dados da prefeitura
      tablesData.push({ table: 'prefeitura', records: [prefeitura] });

      // Buscar dados
      const orgaos = await this.prisma.orgao.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (orgaos.length > 0) {
        tablesData.push({ table: 'orgao', records: orgaos });
      }

      const motoristas = await this.prisma.motorista.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (motoristas.length > 0) {
        tablesData.push({ table: 'motorista', records: motoristas });
      }

      const categorias = await this.prisma.categoria.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (categorias.length > 0) {
        tablesData.push({ table: 'categoria', records: categorias });
      }

      const contasFaturamento = await this.prisma.contaFaturamentoOrgao.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (contasFaturamento.length > 0) {
        tablesData.push({ table: 'conta_faturamento_orgao', records: contasFaturamento });
      }

      const veiculos = await this.prisma.veiculo.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (veiculos.length > 0) {
        tablesData.push({ table: 'veiculo', records: veiculos });
      }

      const usuarios = await this.prisma.usuario.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (usuarios.length > 0) {
        tablesData.push({ table: 'usuario', records: usuarios });
      }

      const processos = await this.prisma.processo.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (processos.length > 0) {
        tablesData.push({ table: 'processo', records: processos });
      }

      // Buscar dados relacionados
      const veiculoIds = veiculos.map((v) => v.id);
      if (veiculoIds.length > 0) {
        const abastecimentos = await this.prisma.abastecimento.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (abastecimentos.length > 0) {
          tablesData.push({ table: 'abastecimento', records: abastecimentos });
        }

        const veiculoCategorias = await this.prisma.veiculoCategoria.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCategorias.length > 0) {
          tablesData.push({ table: 'veiculo_categoria', records: veiculoCategorias });
        }

        const veiculoCombustiveis = await this.prisma.veiculoCombustivel.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCombustiveis.length > 0) {
          tablesData.push({ table: 'veiculo_combustivel', records: veiculoCombustiveis });
        }

        const veiculoMotoristas = await this.prisma.veiculoMotorista.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoMotoristas.length > 0) {
          tablesData.push({ table: 'veiculo_motorista', records: veiculoMotoristas });
        }

        const veiculoCotaPeriodos = await this.prisma.veiculoCotaPeriodo.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCotaPeriodos.length > 0) {
          tablesData.push({ table: 'veiculo_cota_periodo', records: veiculoCotaPeriodos });
        }
      }

      const solicitacoes = await this.prisma.solicitacaoAbastecimento.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (solicitacoes.length > 0) {
        tablesData.push({ table: 'solicitacoes_abastecimento', records: solicitacoes });
      }

      const solicitacoesQrCodeVeiculo = await this.prisma.solicitacoesQrCodeVeiculo.findMany({
        where: { prefeitura_id: user.prefeituraId },
      });
      if (solicitacoesQrCodeVeiculo.length > 0) {
        tablesData.push({ table: 'solicitacoes_qrcode_veiculo', records: solicitacoesQrCodeVeiculo });
      }

      const qrCodesMotorista = await this.prisma.qrCodeMotorista.findMany({
        where: { prefeitura_id: user.prefeituraId },
      });
      if (qrCodesMotorista.length > 0) {
        tablesData.push({ table: 'qrcode_motorista', records: qrCodesMotorista });
      }

      if (processos.length > 0) {
        const processoIds = processos.map((p) => p.id);
        const cotasOrgao = await this.prisma.cotaOrgao.findMany({
          where: { processoId: { in: processoIds } },
        });
        if (cotasOrgao.length > 0) {
          tablesData.push({ table: 'cota_orgao', records: cotasOrgao });
        }

        const processoCombustiveis = await this.prisma.processoCombustivel.findMany({
          where: { processoId: { in: processoIds } },
        });
        if (processoCombustiveis.length > 0) {
          tablesData.push({ table: 'processo_combustivel', records: processoCombustiveis });
        }
      }

      if (usuarios.length > 0 && orgaos.length > 0) {
        const usuarioIds = usuarios.map((u) => u.id);
        const orgaoIds = orgaos.map((o) => o.id);
        const usuarioOrgaos = await this.prisma.usuarioOrgao.findMany({
          where: {
            usuarioId: { in: usuarioIds },
            orgaoId: { in: orgaoIds },
          },
        });
        if (usuarioOrgaos.length > 0) {
          tablesData.push({ table: 'usuario_orgao', records: usuarioOrgaos });
        }
      }
    } else if (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA') {
      if (!user.empresaId) {
        throw new BadRequestException('Usuário não está vinculado a uma empresa');
      }

      filename = `backup_${timestamp}.sql`;

      // Buscar dados da empresa
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.empresaId },
      });

      if (!empresa) {
        throw new NotFoundException('Empresa não encontrada');
      }

      tablesData.push({ table: 'empresa', records: [empresa] });

      // Buscar dados
      const usuarios = await this.prisma.usuario.findMany({
        where: { empresaId: user.empresaId },
      });
      if (usuarios.length > 0) {
        tablesData.push({ table: 'usuario', records: usuarios });
      }

      const contratos = await this.prisma.contrato.findMany({
        where: { empresaId: user.empresaId },
      });
      if (contratos.length > 0) {
        tablesData.push({ table: 'contrato', records: contratos });
      }

      if (contratos.length > 0) {
        const contratoIds = contratos.map((c) => c.id);
        const contratoCombustiveis = await this.prisma.contratoCombustivel.findMany({
          where: { contratoId: { in: contratoIds } },
        });
        if (contratoCombustiveis.length > 0) {
          tablesData.push({ table: 'contrato_combustivel', records: contratoCombustiveis });
        }

        const aditivosContrato = await this.prisma.aditivoContrato.findMany({
          where: { contratoId: { in: contratoIds } },
        });
        if (aditivosContrato.length > 0) {
          tablesData.push({ table: 'aditivo_contrato', records: aditivosContrato });
        }
      }

      const precosCombustiveis = await this.prisma.empresaPrecoCombustivel.findMany({
        where: { empresa_id: user.empresaId },
      });
      if (precosCombustiveis.length > 0) {
        tablesData.push({ table: 'empresa_preco_combustivel', records: precosCombustiveis });
      }

      const abastecimentos = await this.prisma.abastecimento.findMany({
        where: {
          OR: [
            { empresaId: user.empresaId },
            { abastecedorId: user.empresaId },
          ],
        },
      });
      if (abastecimentos.length > 0) {
        tablesData.push({ table: 'abastecimento', records: abastecimentos });
      }

      const solicitacoes = await this.prisma.solicitacaoAbastecimento.findMany({
        where: { empresaId: user.empresaId },
      });
      if (solicitacoes.length > 0) {
        tablesData.push({ table: 'solicitacoes_abastecimento', records: solicitacoes });
      }

      const notificacoes = await this.prisma.notificacao.findMany({
        where: { empresa_id: user.empresaId },
      });
      if (notificacoes.length > 0) {
        tablesData.push({ table: 'notificacao', records: notificacoes });
      }
    } else {
      throw new ForbiddenException('Perfil de usuário não tem permissão para gerar backup');
    }

    // Ordenar tabelas por dependências antes de gerar SQL
    const orderedTablesData = this.sortTablesDataByDependencies(tablesData);

    // Gerar SQL ordenado
    let sqlContent = header;
    if (user.tipo_usuario === 'ADMIN_PREFEITURA' || user.tipo_usuario === 'COLABORADOR_PREFEITURA') {
      sqlContent += `-- Prefeitura ID: ${user.prefeituraId}\n`;
    } else if (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA') {
      sqlContent += `-- Empresa ID: ${user.empresaId}\n`;
    }
    sqlContent += `-- ============================================\n\n`;

    for (const { table, records } of orderedTablesData) {
      if (records.length > 0) {
        sqlContent += this.generateInsertSQL(table, records);
      }
    }

    // Salvar arquivo
    const filepath = path.join(this.backupDir, filename);
    fs.writeFileSync(filepath, sqlContent, 'utf8');

    return filename;
  }

  /**
   * Ordena dados de tabelas por dependências
   */
  private sortTablesDataByDependencies(tablesData: Array<{ table: string; records: any[] }>): Array<{ table: string; records: any[] }> {
    const tableMap = new Map<string, { table: string; records: any[] }>();
    tablesData.forEach((t) => tableMap.set(t.table, t));

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Array<{ table: string; records: any[] }> = [];

    const visit = (tableName: string) => {
      if (visiting.has(tableName)) {
        return;
      }
      if (visited.has(tableName)) {
        return;
      }

      visiting.add(tableName);
      const dependencies = this.TABLE_DEPENDENCIES.get(tableName) || [];
      
      for (const dep of dependencies) {
        if (tableMap.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(tableName);
      visited.add(tableName);

      if (tableMap.has(tableName) && !result.find((t) => t.table === tableName)) {
        result.push(tableMap.get(tableName)!);
      }
    };

    tablesData.forEach((t) => visit(t.table));

    tablesData.forEach((t) => {
      if (!visited.has(t.table)) {
        result.push(t);
      }
    });

    return result;
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(user: any): Promise<any[]> {
    const files = fs.readdirSync(this.backupDir);
    const backups = files
      .filter((file) => file.endsWith('.sql') && file.startsWith('backup_'))
      .map((file) => {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    // Se não for SUPER_ADMIN, filtrar apenas backups relacionados ao seu perfil
    if (user.tipo_usuario !== 'SUPER_ADMIN') {
      // Para outros perfis, podemos retornar apenas os backups que eles podem restaurar
      // Por enquanto, retornamos todos os backups (eles só podem restaurar os deles)
      return backups;
    }

    return backups;
  }

  /**
   * Retorna o conteúdo bruto de um arquivo de backup.
   */
  async getBackupContent(filename: string, user: any): Promise<string> {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo de backup não encontrado');
    }

    if (!filename.endsWith('.sql') || !filename.startsWith('backup_')) {
      throw new NotFoundException('Arquivo inválido');
    }

    // Restringir acesso: usuários não SUPER_ADMIN só podem abrir backups associados a si
    if (user.tipo_usuario !== 'SUPER_ADMIN') {
      const content = fs.readFileSync(filepath, 'utf8');
      const possuiPrefeitura = user.prefeituraId
        ? content.includes(`Prefeitura ID: ${user.prefeituraId}`) || content.includes(`prefeituraId: ${user.prefeituraId}`)
        : false;
      const possuiEmpresa = user.empresaId
        ? content.includes(`Empresa ID: ${user.empresaId}`) || content.includes(`empresaId: ${user.empresaId}`)
        : false;

      if (!possuiPrefeitura && !possuiEmpresa) {
        throw new ForbiddenException('Você não tem permissão para visualizar este backup');
      }
    }

    return fs.readFileSync(filepath, 'utf8');
  }

  /**
   * Restaura backup do banco de dados
   */
  async restoreBackup(filename: string, user: any): Promise<void> {
    const filepath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo de backup não encontrado');
    }

    // Verificar se é SUPER_ADMIN ou se o backup pertence ao usuário
    if (user.tipo_usuario !== 'SUPER_ADMIN') {
      // Verificar se o backup contém dados do usuário
      const content = fs.readFileSync(filepath, 'utf8');
      if (user.prefeituraId && !content.includes(`Prefeitura ID: ${user.prefeituraId}`) && !content.includes(`prefeituraId: ${user.prefeituraId}`)) {
        if (user.empresaId && !content.includes(`Empresa ID: ${user.empresaId}`) && !content.includes(`empresaId: ${user.empresaId}`)) {
          throw new ForbiddenException('Você não tem permissão para restaurar este backup');
        }
      }
    }

    try {
      // Ler conteúdo do arquivo SQL
      const sqlContent = fs.readFileSync(filepath, 'utf8');

      // Executar SQL diretamente usando Prisma (não depende de ferramentas externas)
      // Dividir em comandos individuais (considerando múltiplas linhas)
      const lines = sqlContent.split('\n');
      const commands: string[] = [];
      let currentCommand = '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Ignorar comentários e linhas vazias
        if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
          continue;
        }

        currentCommand += ' ' + line;
        
        // Se a linha termina com ;, finaliza o comando
        if (trimmedLine.endsWith(';')) {
          const cmd = currentCommand.trim();
          if (cmd.length > 0) {
            commands.push(cmd);
          }
          currentCommand = '';
        }
      }

      // Executar comandos em transação
      await this.prisma.$transaction(async (tx) => {
        for (const command of commands) {
          if (command.trim() && !command.trim().startsWith('--')) {
            try {
              await tx.$executeRawUnsafe(command);
            } catch (error: any) {
              // Ignorar erros de chave duplicada (INSERT que já existe)
              if (!error?.message?.includes('duplicate key') && !error?.message?.includes('already exists')) {
                throw error;
              }
            }
          }
        }
      });
    } catch (error: any) {
      throw new BadRequestException(`Erro ao restaurar backup: ${error?.message || error}`);
    }
  }

  /**
   * Obtém todos os registros de um delegate Prisma de forma genérica.
   */
  private async fetchAllRecords(modelKey: string): Promise<any[]> {
    const delegate = (this.prisma as Record<string, any>)[modelKey];
    if (!delegate || typeof delegate.findMany !== 'function') {
      throw new Error(`Delegate Prisma "${modelKey}" não encontrado.`);
    }

    return delegate.findMany();
  }

  /**
   * Gera SQL INSERT para uma tabela
   */
  private generateInsertSQL(tableName: string, records: any[]): string {
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

  /**
   * Gera timestamp no formato DD-MM-YYYY-HHMMSS-MMM (inclui milissegundos para garantir unicidade)
   */
  private getTimestamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${day}-${month}-${year}-${hours}${minutes}${seconds}-${milliseconds}`;
  }

  /**
   * Busca todas as tabelas do banco de dados PostgreSQL
   */
  private async getAllTablesFromDatabase(): Promise<Array<{ model: string; table: string }>> {
    try {
      // Query SQL para buscar todas as tabelas do schema público
      const result = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      // Mapear nomes de tabelas para modelos Prisma
      // A conversão é: snake_case -> camelCase (primeira letra minúscula)
      const tables = result.map((row) => {
        const tableName = row.table_name;
        // Converter snake_case para camelCase
        const modelName = this.tableNameToModelName(tableName);
        return {
          model: modelName,
          table: tableName,
        };
      });

      return tables;
    } catch (error: any) {
      throw new BadRequestException(`Erro ao buscar tabelas do banco de dados: ${error.message}`);
    }
  }

  /**
   * Converte nome de tabela (snake_case) para nome de modelo Prisma (camelCase)
   */
  private tableNameToModelName(tableName: string): string {
    // Dividir por underscore e converter primeira letra de cada palavra para minúscula
    // exceto a primeira palavra que já começa minúscula
    const parts = tableName.split('_');
    const camelCase = parts
      .map((part, index) => {
        if (index === 0) {
          return part.charAt(0).toLowerCase() + part.slice(1);
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');

    return camelCase;
  }

  /**
   * Remove um backup
   */
  async deleteBackup(filename: string, user: any): Promise<void> {
    if (user.tipo_usuario !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Apenas SUPER_ADMIN pode excluir backups');
    }

    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo de backup não encontrado');
    }

    fs.unlinkSync(filepath);
  }

  /**
   * Verifica se uma tabela tem registros atualizados (com modified_date ou created_date recente)
   */
  private async hasUpdatedRecords(table: string): Promise<boolean> {
    try {
      // Escapar o nome da tabela para evitar SQL injection
      const escapedTable = table.replace(/"/g, '""');
      
      // Verificar se a tabela tem coluna modified_date ou created_date
      const hasModifiedDate = await this.prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = '${escapedTable}' 
          AND column_name IN ('modified_date', 'created_date', 'data_cadastro')
        LIMIT 1
      `);

      if (!hasModifiedDate || (hasModifiedDate as any[]).length === 0) {
        // Se não tiver coluna de data, considerar que tem registros atualizados
        return true;
      }

      // Verificar se há registros com modified_date ou created_date não nulo
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM "${escapedTable}"
        WHERE modified_date IS NOT NULL 
           OR created_date IS NOT NULL 
           OR data_cadastro IS NOT NULL
        LIMIT 1
      `);

      const count = (result as any[])[0]?.count || 0;
      return count > 0;
    } catch (error: any) {
      // Em caso de erro, considerar que a tabela tem registros atualizados
      console.warn(`Erro ao verificar registros atualizados na tabela ${table}:`, error.message);
      return true;
    }
  }

  /**
   * Gera backup geral por tabela, criando uma pasta com data_hora e um arquivo SQL para cada tabela
   * Agora filtra apenas tabelas que foram atualizadas (têm registros com modified_date ou created_date)
   * Cada backup é salvo em uma pasta única com timestamp incluindo milissegundos
   */
  async generateBackupByTable(): Promise<{
    folderName: string;
    folderPath: string;
    tables: Array<{ table: string; filename: string; records: number; size: number }>;
    totalFiles: number;
    totalSize: number;
  }> {
    // Gerar timestamp único com milissegundos para evitar sobrescrita
    const baseTimestamp = this.getTimestamp();
    let timestamp = baseTimestamp;
    let folderName = `backup-${timestamp}`;
    let folderPath = path.join(this.backupDir, folderName);
    
    // Garantir que a pasta não existe (adicionar contador se necessário)
    let counter = 0;
    while (fs.existsSync(folderPath)) {
      counter++;
      timestamp = `${baseTimestamp}-${counter}`;
      folderName = `backup-${timestamp}`;
      folderPath = path.join(this.backupDir, folderName);
    }

    try {
      // Criar pasta única para este backup
      fs.mkdirSync(folderPath, { recursive: true });

      // Buscar TODAS as tabelas do banco de dados
      const allTables = await this.getAllTablesFromDatabase();

      const tables: Array<{ table: string; filename: string; records: number; size: number }> = [];
      let totalSize = 0;

      // Gerar arquivo SQL apenas para tabelas atualizadas
      for (const { model, table } of allTables) {
        try {
          // Verificar se a tabela tem registros atualizados
          const hasUpdated = await this.hasUpdatedRecords(table);
          if (!hasUpdated) {
            // Pular tabelas sem registros atualizados
            continue;
          }

          // Tentar buscar registros usando o modelo Prisma
          let records: any[] = [];
          try {
            records = await this.fetchAllRecords(model);
          } catch (modelError: any) {
            // Se o modelo não existir no Prisma, tentar buscar diretamente via SQL
            console.warn(`Modelo ${model} não encontrado no Prisma, tentando busca direta via SQL para tabela ${table}`);
            try {
              const sqlResult = await this.prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
              records = sqlResult as any[];
            } catch (sqlError: any) {
              console.error(`Erro ao buscar dados da tabela ${table} via SQL:`, sqlError.message);
              records = [];
            }
          }
          
          // Gerar SQL INSERT
          const sqlContent = this.generateInsertSQLWithHeader(table, records);
          
          // Nome do arquivo: nome da tabela + .sql
          const filename = `${table}.sql`;
          const filepath = path.join(folderPath, filename);
          
          // Salvar arquivo
          fs.writeFileSync(filepath, sqlContent, 'utf8');
          
          // Obter tamanho do arquivo
          const stats = fs.statSync(filepath);
          const fileSize = stats.size;
          totalSize += fileSize;
          
          // Adicionar à lista de tabelas processadas
          tables.push({
            table,
            filename,
            records: records.length,
            size: fileSize,
          });
        } catch (error: any) {
          // Se houver erro ao processar uma tabela, registrar mas continuar com as outras
          console.error(`Erro ao processar tabela ${table}:`, error.message);
          // Criar arquivo com mensagem de erro
          const filename = `${table}.sql`;
          const filepath = path.join(folderPath, filename);
          const errorContent = `-- Erro ao gerar backup da tabela ${table}\n-- ${error.message}\n-- Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
          fs.writeFileSync(filepath, errorContent, 'utf8');
          
          const stats = fs.statSync(filepath);
          tables.push({
            table,
            filename,
            records: 0,
            size: stats.size,
          });
        }
      }

      // Criar arquivo de índice com informações do backup
      const indexContent = this.generateBackupIndex(folderName, timestamp, tables, totalSize, allTables.length);
      const indexPath = path.join(folderPath, 'BACKUP_INFO.txt');
      fs.writeFileSync(indexPath, indexContent, 'utf8');

      return {
        folderName,
        folderPath,
        tables,
        totalFiles: tables.length,
        totalSize,
      };
    } catch (error: any) {
      throw new BadRequestException(`Erro ao gerar backup por tabela: ${error.message}`);
    }
  }

  /**
   * Gera arquivo de índice com informações do backup
   */
  private generateBackupIndex(
    folderName: string,
    timestamp: string,
    tables: Array<{ table: string; filename: string; records: number; size: number }>,
    totalSize: number,
    totalTablesInDb?: number,
  ): string {
    const now = new Date();
    let content = `============================================
INFORMAÇÕES DO BACKUP
============================================
Nome da Pasta: ${folderName}
Timestamp: ${timestamp}
Data/Hora: ${now.toLocaleString('pt-BR')}
Total de Tabelas no Banco: ${totalTablesInDb || 'N/A'}
Total de Tabelas no Backup: ${tables.length}
Tamanho Total: ${this.formatBytes(totalSize)}
Nota: Este backup contém apenas tabelas atualizadas (com registros que possuem modified_date, created_date ou data_cadastro)
============================================

TABELAS INCLUÍDAS NO BACKUP:
============================================
`;

    tables.forEach((table, index) => {
      content += `${index + 1}. ${table.table}\n`;
      content += `   Arquivo: ${table.filename}\n`;
      content += `   Registros: ${table.records}\n`;
      content += `   Tamanho: ${this.formatBytes(table.size)}\n\n`;
    });

    content += `============================================
FIM DO ÍNDICE
============================================
`;

    return content;
  }

  /**
   * Formata bytes para formato legível (KB, MB, GB)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Gera SQL INSERT com cabeçalho para uma tabela
   */
  private generateInsertSQLWithHeader(tableName: string, records: any[]): string {
    let sql = `-- ============================================
-- BACKUP DA TABELA: ${tableName}
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Total de registros: ${records.length}
-- ============================================

`;

    if (records.length === 0) {
      sql += `-- Tabela ${tableName} está vazia. Nenhum registro para inserir.\n\n`;
      return sql;
    }

    sql += `-- Inserir dados na tabela ${tableName}\n`;
    sql += `-- Total de registros: ${records.length}\n\n`;

    for (const record of records) {
      const keys = Object.keys(record).filter((key) => record[key] !== undefined);
      const values = keys.map((key) => {
        const value = record[key];
        if (value === null) return 'NULL';
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        // Tratar Decimal do Prisma (objeto com toString que retorna número)
        if (typeof value === 'object' && value !== null && typeof value.toString === 'function') {
          const stringValue = value.toString();
          // Tentar converter para número (Decimal do Prisma retorna string numérica)
          const numValue = parseFloat(stringValue);
          if (!isNaN(numValue) && isFinite(numValue)) {
            return numValue;
          }
          // Se não for número, tratar como string
          return `'${stringValue.replace(/'/g, "''")}'`;
        }
        // Para outros tipos, converter para string
        return `'${String(value).replace(/'/g, "''")}'`;
      });

      sql += `INSERT INTO ${tableName} (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
    }

    sql += '\n';
    return sql;
  }
}

