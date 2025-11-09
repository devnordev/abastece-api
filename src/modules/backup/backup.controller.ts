import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Delete,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Backup')
@Controller('backup')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar backup do banco de dados' })
  @ApiResponse({ status: 201, description: 'Backup gerado com sucesso' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  async generateBackup(@CurrentUser() user: any) {
    const filename = await this.backupService.generateBackupByUser(user);
    return {
      message: 'Backup gerado com sucesso',
      filename,
      downloadUrl: `/backup/download/${filename}`,
    };
  }

  @Post('generate/full')
  @ApiOperation({ summary: 'Gerar backup completo do banco de dados (apenas SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Backup completo gerado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode gerar backup completo' })
  async generateFullBackup(@CurrentUser() user: any) {
    const filename = await this.backupService.generateFullBackup();
    return {
      message: 'Backup completo gerado com sucesso',
      filename,
      downloadUrl: `/backup/download/${filename}`,
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'Listar todos os backups disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de backups retornada com sucesso' })
  async listBackups(@CurrentUser() user: any) {
    const backups = await this.backupService.listBackups(user);
    return {
      message: 'Backups listados com sucesso',
      backups,
    };
  }

  @Get('view/:filename')
  @ApiOperation({
    summary: 'Visualizar conteúdo de um backup em texto',
    description: 'Retorna o conteúdo bruto do arquivo de backup solicitado (apenas .sql gerados pelo sistema).',
  })
  @ApiResponse({ status: 200, description: 'Conteúdo do backup retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  @ApiResponse({ status: 403, description: 'Usuário não tem permissão para o backup solicitado' })
  async viewBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any,
    @Query('format') format?: 'json',
  ) {
    const content = await this.backupService.getBackupContent(filename, user);

    if (format === 'json') {
      return { filename, content };
    }

    return content;
  }

  @Post('restore/:filename')
  @ApiOperation({ summary: 'Restaurar backup do banco de dados' })
  @ApiResponse({ status: 200, description: 'Backup restaurado com sucesso' })
  @ApiResponse({ status: 404, description: 'Arquivo de backup não encontrado' })
  @ApiResponse({ status: 403, description: 'Não autorizado para restaurar este backup' })
  async restoreBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any,
  ) {
    await this.backupService.restoreBackup(filename, user);
    return {
      message: 'Backup restaurado com sucesso',
    };
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download do arquivo de backup' })
  @ApiResponse({ status: 200, description: 'Arquivo de backup' })
  @ApiResponse({ status: 404, description: 'Arquivo não encontrado' })
  async downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
    const filepath = path.join(process.cwd(), 'backups', filename);
    
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Validar que é um arquivo .sql
    if (!filename.endsWith('.sql') || !filename.startsWith('backup_')) {
      throw new NotFoundException('Arquivo inválido');
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Excluir backup (apenas SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Backup excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode excluir backups' })
  async deleteBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: any,
  ) {
    await this.backupService.deleteBackup(filename, user);
    return {
      message: 'Backup excluído com sucesso',
    };
  }
}

