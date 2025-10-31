import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';
import { AcaoLog } from '@prisma/client';

@ApiTags('Logs')
@Controller('logs')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os logs de alterações' })
  @ApiResponse({ status: 200, description: 'Lista de logs retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  @ApiQuery({ name: 'tabela', required: false, description: 'Filtrar por nome da tabela' })
  @ApiQuery({ name: 'acao', required: false, description: 'Filtrar por ação (INSERT, UPDATE, DELETE)' })
  @ApiQuery({ name: 'executadoPor', required: false, description: 'Filtrar por ID do usuário que executou' })
  @ApiQuery({ name: 'dataInicial', required: false, description: 'Data inicial para filtro (formato ISO)' })
  @ApiQuery({ name: 'dataFinal', required: false, description: 'Data final para filtro (formato ISO)' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tabela') tabela?: string,
    @Query('acao') acao?: AcaoLog,
    @Query('executadoPor') executadoPor?: string,
    @Query('dataInicial') dataInicial?: string,
    @Query('dataFinal') dataFinal?: string,
  ) {
    return this.logService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      tabela,
      acao,
      executadoPor ? parseInt(executadoPor) : undefined,
      dataInicial,
      dataFinal,
    );
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas dos logs' })
  @ApiResponse({ status: 200, description: 'Estatísticas de logs retornadas com sucesso' })
  async getEstatisticas() {
    return this.logService.getEstatisticas();
  }

  @Get('tabelas')
  @ApiOperation({ summary: 'Listar todas as tabelas que têm logs' })
  @ApiResponse({ status: 200, description: 'Lista de tabelas retornada com sucesso' })
  async getTabelasDisponiveis() {
    return this.logService.getTabelasDisponiveis();
  }

  @Get('tabela/:tabela/registro/:id')
  @ApiOperation({ summary: 'Listar logs de um registro específico' })
  @ApiResponse({ status: 200, description: 'Lista de logs do registro retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findByTabela(
    @Param('tabela') tabela: string,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.logService.findByTabela(
      tabela,
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar log específico por ID' })
  @ApiResponse({ status: 200, description: 'Log encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Log não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.logService.findOne(id);
  }
}
