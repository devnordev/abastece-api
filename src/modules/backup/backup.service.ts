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

  constructor(private prisma: PrismaService) {
    // Criar diretório de backups se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Gera backup completo do banco de dados (apenas SUPER_ADMIN)
   */
  async generateFullBackup(): Promise<string> {
    const timestamp = this.getTimestamp();
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      let sqlContent = `-- ============================================
-- BACKUP COMPLETO DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Tipo: Backup Completo
-- Gerado via: API Backup Service
-- ============================================

`;
      for (const { model, table } of this.FULL_BACKUP_MODELS) {
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
   */
  async generateBackupByUser(user: any): Promise<string> {
    const timestamp = this.getTimestamp();
    let filename: string;
    let sqlContent = '';

    // Determinar tipo de backup baseado no perfil
    if (user.tipo_usuario === 'SUPER_ADMIN') {
      return this.generateFullBackup();
    }

    // Cabeçalho do backup
    sqlContent += `-- ============================================
-- BACKUP DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Perfil: ${user.tipo_usuario}
-- Usuário: ${user.nome} (${user.email})
`;

    if (user.tipo_usuario === 'ADMIN_PREFEITURA' || user.tipo_usuario === 'COLABORADOR_PREFEITURA') {
      if (!user.prefeituraId) {
        throw new BadRequestException('Usuário não está vinculado a uma prefeitura');
      }

      filename = `backup_${timestamp}.sql`;
      sqlContent += `-- Prefeitura ID: ${user.prefeituraId}
-- ============================================

`;

      // Buscar dados da prefeitura
      const prefeitura = await this.prisma.prefeitura.findUnique({
        where: { id: user.prefeituraId },
      });

      if (!prefeitura) {
        throw new NotFoundException('Prefeitura não encontrada');
      }

      // Gerar SQL para prefeitura
      sqlContent += this.generateInsertSQL('prefeitura', [prefeitura]);

      // Buscar e gerar SQL para órgãos
      const orgaos = await this.prisma.orgao.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (orgaos.length > 0) {
        sqlContent += this.generateInsertSQL('orgao', orgaos);
      }

      // Buscar e gerar SQL para veículos
      const veiculos = await this.prisma.veiculo.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (veiculos.length > 0) {
        sqlContent += this.generateInsertSQL('veiculo', veiculos);
      }

      // Buscar e gerar SQL para motoristas
      const motoristas = await this.prisma.motorista.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (motoristas.length > 0) {
        sqlContent += this.generateInsertSQL('motorista', motoristas);
      }

      // Buscar e gerar SQL para usuários da prefeitura
      const usuarios = await this.prisma.usuario.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (usuarios.length > 0) {
        sqlContent += this.generateInsertSQL('usuario', usuarios);
      }

      // Buscar e gerar SQL para categorias
      const categorias = await this.prisma.categoria.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (categorias.length > 0) {
        sqlContent += this.generateInsertSQL('categoria', categorias);
      }

      // Buscar e gerar SQL para processos
      const processos = await this.prisma.processo.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (processos.length > 0) {
        sqlContent += this.generateInsertSQL('processo', processos);
      }

      // Buscar e gerar SQL para contas de faturamento
      const contasFaturamento = await this.prisma.contaFaturamentoOrgao.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (contasFaturamento.length > 0) {
        sqlContent += this.generateInsertSQL('conta_faturamento_orgao', contasFaturamento);
      }

      // Buscar e gerar SQL para abastecimentos relacionados
      const veiculoIds = veiculos.map((v) => v.id);
      if (veiculoIds.length > 0) {
        const abastecimentos = await this.prisma.abastecimento.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (abastecimentos.length > 0) {
          sqlContent += this.generateInsertSQL('abastecimento', abastecimentos);
        }
      }

      const solicitacoes = await this.prisma.solicitacaoAbastecimento.findMany({
        where: { prefeituraId: user.prefeituraId },
      });
      if (solicitacoes.length > 0) {
        sqlContent += this.generateInsertSQL('solicitacoes_abastecimento', solicitacoes);
      }

      // Buscar e gerar SQL para solicitações de QR Code de veículos
      const solicitacoesQrCodeVeiculo = await this.prisma.solicitacoesQrCodeVeiculo.findMany({
        where: { prefeitura_id: user.prefeituraId },
      });
      if (solicitacoesQrCodeVeiculo.length > 0) {
        sqlContent += this.generateInsertSQL('solicitacoes_qrcode_veiculo', solicitacoesQrCodeVeiculo);
      }

      // Buscar e gerar SQL para QR Codes de motoristas
      const qrCodesMotorista = await this.prisma.qrCodeMotorista.findMany({
        where: { prefeitura_id: user.prefeituraId },
      });
      if (qrCodesMotorista.length > 0) {
        sqlContent += this.generateInsertSQL('qrcode_motorista', qrCodesMotorista);
      }

      // Buscar e gerar SQL para tabelas relacionadas
      if (processos.length > 0) {
        const processoIds = processos.map((p) => p.id);
        const cotasOrgao = await this.prisma.cotaOrgao.findMany({
          where: { processoId: { in: processoIds } },
        });
        if (cotasOrgao.length > 0) {
          sqlContent += this.generateInsertSQL('cota_orgao', cotasOrgao);
        }

        const processoCombustiveis = await this.prisma.processoCombustivel.findMany({
          where: { processoId: { in: processoIds } },
        });
        if (processoCombustiveis.length > 0) {
          sqlContent += this.generateInsertSQL('processo_combustivel', processoCombustiveis);
        }
      }

      // Buscar tabelas de relacionamento
      if (veiculos.length > 0) {
        const veiculoIds = veiculos.map((v) => v.id);
        const veiculoCategorias = await this.prisma.veiculoCategoria.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCategorias.length > 0) {
          sqlContent += this.generateInsertSQL('veiculo_categoria', veiculoCategorias);
        }

        const veiculoCombustiveis = await this.prisma.veiculoCombustivel.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCombustiveis.length > 0) {
          sqlContent += this.generateInsertSQL('veiculo_combustivel', veiculoCombustiveis);
        }

        const veiculoMotoristas = await this.prisma.veiculoMotorista.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoMotoristas.length > 0) {
          sqlContent += this.generateInsertSQL('veiculo_motorista', veiculoMotoristas);
        }

        const veiculoCotaPeriodos = await this.prisma.veiculoCotaPeriodo.findMany({
          where: { veiculoId: { in: veiculoIds } },
        });
        if (veiculoCotaPeriodos.length > 0) {
          sqlContent += this.generateInsertSQL('veiculo_cota_periodo', veiculoCotaPeriodos);
        }
      }

      // Buscar usuários órgãos
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
          sqlContent += this.generateInsertSQL('usuario_orgao', usuarioOrgaos);
        }
      }
    } else if (user.tipo_usuario === 'ADMIN_EMPRESA' || user.tipo_usuario === 'COLABORADOR_EMPRESA') {
      if (!user.empresaId) {
        throw new BadRequestException('Usuário não está vinculado a uma empresa');
      }

      filename = `backup_${timestamp}.sql`;
      sqlContent += `-- Empresa ID: ${user.empresaId}
-- ============================================

`;

      // Buscar dados da empresa
      const empresa = await this.prisma.empresa.findUnique({
        where: { id: user.empresaId },
      });

      if (!empresa) {
        throw new NotFoundException('Empresa não encontrada');
      }

      // Gerar SQL para empresa
      sqlContent += this.generateInsertSQL('empresa', [empresa]);

      // Buscar e gerar SQL para usuários da empresa
      const usuarios = await this.prisma.usuario.findMany({
        where: { empresaId: user.empresaId },
      });
      if (usuarios.length > 0) {
        sqlContent += this.generateInsertSQL('usuario', usuarios);
      }

      // Buscar e gerar SQL para contratos
      const contratos = await this.prisma.contrato.findMany({
        where: { empresaId: user.empresaId },
      });
      if (contratos.length > 0) {
        sqlContent += this.generateInsertSQL('contrato', contratos);
      }

      // Buscar tabelas relacionadas aos contratos
      if (contratos.length > 0) {
        const contratoIds = contratos.map((c) => c.id);
        const contratoCombustiveis = await this.prisma.contratoCombustivel.findMany({
          where: { contratoId: { in: contratoIds } },
        });
        if (contratoCombustiveis.length > 0) {
          sqlContent += this.generateInsertSQL('contrato_combustivel', contratoCombustiveis);
        }

        const aditivosContrato = await this.prisma.aditivoContrato.findMany({
          where: { contratoId: { in: contratoIds } },
        });
        if (aditivosContrato.length > 0) {
          sqlContent += this.generateInsertSQL('aditivo_contrato', aditivosContrato);
        }
      }

      // Buscar e gerar SQL para preços de combustíveis
      const precosCombustiveis = await this.prisma.empresaPrecoCombustivel.findMany({
        where: { empresa_id: user.empresaId },
      });
      if (precosCombustiveis.length > 0) {
        sqlContent += this.generateInsertSQL('empresa_preco_combustivel', precosCombustiveis);
      }

      // Buscar abastecimentos relacionados à empresa
      const abastecimentos = await this.prisma.abastecimento.findMany({
        where: {
          OR: [
            { empresaId: user.empresaId },
            { abastecedorId: user.empresaId },
          ],
        },
      });
      if (abastecimentos.length > 0) {
        sqlContent += this.generateInsertSQL('abastecimento', abastecimentos);
      }

      const solicitacoes = await this.prisma.solicitacaoAbastecimento.findMany({
        where: { empresaId: user.empresaId },
      });
      if (solicitacoes.length > 0) {
        sqlContent += this.generateInsertSQL('solicitacoes_abastecimento', solicitacoes);
      }

      const notificacoes = await this.prisma.notificacao.findMany({
        where: { empresa_id: user.empresaId },
      });
      if (notificacoes.length > 0) {
        sqlContent += this.generateInsertSQL('notificacao', notificacoes);
      }
    } else {
      throw new ForbiddenException('Perfil de usuário não tem permissão para gerar backup');
    }

    // Salvar arquivo
    const filepath = path.join(this.backupDir, filename);
    fs.writeFileSync(filepath, sqlContent, 'utf8');

    return filename;
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
   * Gera backup geral por tabela, criando uma pasta com data_hora e um arquivo SQL para cada tabela
   * Busca TODAS as tabelas do banco de dados dinamicamente
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

      // Gerar arquivo SQL para cada tabela encontrada no banco
      for (const { model, table } of allTables) {
        try {
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
      const indexContent = this.generateBackupIndex(folderName, timestamp, tables, totalSize);
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
  ): string {
    const now = new Date();
    let content = `============================================
INFORMAÇÕES DO BACKUP
============================================
Nome da Pasta: ${folderName}
Timestamp: ${timestamp}
Data/Hora: ${now.toLocaleString('pt-BR')}
Total de Tabelas: ${tables.length}
Tamanho Total: ${this.formatBytes(totalSize)}
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

