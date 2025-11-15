import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProcessoService } from './processo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProcessoDto, UpdateProcessoDto, FindProcessoDto } from './dto';

@ApiTags('Processos')
@Controller('processos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProcessoController {
  constructor(private readonly processoService: ProcessoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo processo' })
  @ApiResponse({ status: 201, description: 'Processo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou campos obrigatórios não informados' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 409, description: 'Esta prefeitura já possui um processo cadastrado' })
  async create(@Body() data: CreateProcessoDto) {
    return this.processoService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar processos com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de processos retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página para paginação', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página', example: 10 })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'ID da prefeitura para filtrar processos (opcional). Para ADMIN_PREFEITURA, se não informado, usa automaticamente a prefeitura do usuário.', example: 1 })
  @ApiQuery({ name: 'status', required: false, description: 'Status do processo para filtrar', enum: ['ATIVO', 'INATIVO', 'ENCERRADO'] })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por processos ativos/inativos', example: true })
  async findAll(@Query() query: FindProcessoDto, @Request() req) {
    const user = req.user;
    
    // Se for ADMIN_PREFEITURA e não tiver prefeituraId na query, usar a prefeitura do usuário
    let prefeituraId = query.prefeituraId;
    if (user?.tipo_usuario === 'ADMIN_PREFEITURA' && !prefeituraId && user?.prefeitura?.id) {
      prefeituraId = user.prefeitura.id;
    }
    
    return this.processoService.findAll(
      query.page || 1,
      query.limit || 10,
      prefeituraId,
      query.status,
      query.ativo,
    );
  }

  @Get('prefeitura/:prefeituraId/detalhado')
  @ApiOperation({ summary: 'Buscar processo detalhado por prefeitura' })
  @ApiResponse({ status: 200, description: 'Processo detalhado encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Processo não encontrado para esta prefeitura' })
  async findByPrefeituraDetalhado(@Param('prefeituraId', ParseIntPipe) prefeituraId: number) {
    return this.processoService.findByPrefeituraDetalhado(prefeituraId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo por ID' })
  @ApiResponse({ status: 200, description: 'Processo encontrado com sucesso' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.processoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar processo' })
  @ApiResponse({ status: 200, description: 'Processo atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Processo não encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProcessoDto,
  ) {
    return this.processoService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir processo' })
  @ApiResponse({ status: 200, description: 'Processo excluído com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.processoService.remove(id);
  }
}
