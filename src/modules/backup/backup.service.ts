import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backups');

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
      // Obter string de conexão do banco
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new BadRequestException('DATABASE_URL não configurada');
      }

      // Extrair informações da URL de conexão
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.substring(1);
      const username = url.username;
      const password = url.password;

      // Gerar script SQL usando pg_dump
      const env = { ...process.env, PGPASSWORD: password };
      const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl --clean --if-exists --inserts > "${filepath}"`;

      await execAsync(command, { env, maxBuffer: 10 * 1024 * 1024 });

      // Adicionar comentário no início do arquivo
      const header = `-- ============================================
-- BACKUP COMPLETO DO BANCO DE DADOS
-- Data/Hora: ${new Date().toLocaleString('pt-BR')}
-- Timestamp: ${timestamp}
-- Tipo: Backup Completo
-- ============================================

`;
      const content = fs.readFileSync(filepath, 'utf8');
      fs.writeFileSync(filepath, header + content);

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

      // Se for backup completo (gerado por pg_dump), usar psql
      if (sqlContent.includes('-- Backup Completo') || sqlContent.includes('pg_dump')) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new BadRequestException('DATABASE_URL não configurada');
        }

        const url = new URL(databaseUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.substring(1);
        const username = url.username;
        const password = url.password;

        const env = { ...process.env, PGPASSWORD: password };
        const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;

        await execAsync(command, { env, maxBuffer: 10 * 1024 * 1024 });
      } else {
        // Se for backup gerado pela aplicação, executar SQL diretamente
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
      }
    } catch (error) {
      throw new BadRequestException(`Erro ao restaurar backup: ${error.message}`);
    }
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
   * Gera timestamp no formato DD-MM-YYYY-HHMMSS
   */
  private getTimestamp(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}-${month}-${year}-${hours}${minutes}${seconds}`;
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
}

