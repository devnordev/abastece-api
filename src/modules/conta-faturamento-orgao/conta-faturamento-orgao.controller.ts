import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContaFaturamentoOrgaoService } from './conta-faturamento-orgao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';
import { CreateContaFaturamentoOrgaoDto, UpdateContaFaturamentoOrgaoDto } from './dto';

@ApiTags('Contas de Faturamento - Órgão')
@Controller('contas-faturamento-orgao')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN', 'COLABORADOR_PREFEITURA', 'ADMIN_EMPRESA', 'COLABORADOR_EMPRESA']))
@ApiBearerAuth()
export class ContaFaturamentoOrgaoController {
  constructor(private readonly contaFaturamentoOrgaoService: ContaFaturamentoOrgaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta de faturamento de órgão' })
  @ApiResponse({ status: 201, description: 'Conta de faturamento criada com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar conta de faturamento' })
  @ApiResponse({ status: 404, description: 'Prefeitura ou órgão não encontrado' })
  @ApiResponse({ status: 409, description: 'Conta de faturamento já existe para este órgão' })
  async create(@Body() createDto: CreateContaFaturamentoOrgaoDto, @Request() req) {
    return this.contaFaturamentoOrgaoService.create(createDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas de faturamento de órgão' })
  @ApiResponse({ status: 200, description: 'Lista de contas de faturamento retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({ name: 'prefeituraId', required: false, type: Number, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'orgaoId', required: false, type: Number, description: 'Filtrar por órgão' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('prefeituraId') prefeituraId?: string,
    @Query('orgaoId') orgaoId?: string,
  ) {
    return this.contaFaturamentoOrgaoService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      prefeituraId ? parseInt(prefeituraId) : undefined,
      orgaoId ? parseInt(orgaoId) : undefined,
      req.user?.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta de faturamento por ID' })
  @ApiResponse({ status: 200, description: 'Conta de faturamento encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta de faturamento não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar esta conta de faturamento' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.contaFaturamentoOrgaoService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta de faturamento' })
  @ApiResponse({ status: 200, description: 'Conta de faturamento atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta de faturamento não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para atualizar esta conta de faturamento' })
  @ApiResponse({ status: 409, description: 'Já existe uma conta com este nome para este órgão' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateContaFaturamentoOrgaoDto,
    @Request() req,
  ) {
    return this.contaFaturamentoOrgaoService.update(id, updateDto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir conta de faturamento' })
  @ApiResponse({ status: 200, description: 'Conta de faturamento excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Conta de faturamento não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir esta conta de faturamento' })
  @ApiResponse({ status: 409, description: 'Não é possível excluir: há veículos ou abastecimentos vinculados' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.contaFaturamentoOrgaoService.remove(id, req.user?.id);
  }
}

