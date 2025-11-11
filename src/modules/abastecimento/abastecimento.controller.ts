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
import { AbastecimentoService } from './abastecimento.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';

@ApiTags('Abastecimentos')
@Controller('abastecimentos')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class AbastecimentoController {
  constructor(private readonly abastecimentoService: AbastecimentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo abastecimento' })
  @ApiResponse({ status: 201, description: 'Abastecimento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createAbastecimentoDto: CreateAbastecimentoDto) {
    return this.abastecimentoService.create(createAbastecimentoDto);
  }

  @Post('from-solicitacao')
  @ApiOperation({ summary: 'Criar abastecimento a partir de uma solicitação de abastecimento' })
  @ApiResponse({ status: 201, description: 'Abastecimento criado a partir da solicitação com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou solicitação não está aprovada' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 409, description: 'Solicitação já possui abastecimento vinculado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async createFromSolicitacao(
    @Body() createDto: CreateAbastecimentoFromSolicitacaoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.createFromSolicitacao(createDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar abastecimentos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de abastecimentos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'veiculoId', required: false, description: 'Filtrar por veículo' })
  @ApiQuery({ name: 'motoristaId', required: false, description: 'Filtrar por motorista' })
  @ApiQuery({ name: 'combustivelId', required: false, description: 'Filtrar por combustível' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por empresa' })
  @ApiQuery({ name: 'tipo_abastecimento', required: false, description: 'Filtrar por tipo de abastecimento' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'data_inicial', required: false, description: 'Data inicial para filtro' })
  @ApiQuery({ name: 'data_final', required: false, description: 'Data final para filtro' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findAbastecimentoDto: FindAbastecimentoDto) {
    return this.abastecimentoService.findAll(findAbastecimentoDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar abastecimento por ID' })
  @ApiResponse({ status: 200, description: 'Abastecimento encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.abastecimentoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbastecimentoDto: UpdateAbastecimentoDto,
  ) {
    return this.abastecimentoService.update(id, updateAbastecimentoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.abastecimentoService.remove(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento aprovado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.abastecimentoService.approve(id, req.user.id, req.user.email);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeitar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento rejeitado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.abastecimentoService.reject(id, req.user.id, req.user.email, motivo);
  }
}
