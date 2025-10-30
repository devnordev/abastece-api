import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessoService } from './processo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProcessoDto, UpdateProcessoDto } from './dto';

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
  @ApiOperation({ summary: 'Listar processos' })
  @ApiResponse({ status: 200, description: 'Lista de processos retornada com sucesso' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('prefeituraId') prefeituraId?: string,
    @Query('status') status?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.processoService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      prefeituraId ? parseInt(prefeituraId) : undefined,
      status as any,
      ativo ? ativo === 'true' : undefined,
    );
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
