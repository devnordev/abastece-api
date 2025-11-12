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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProcessoCombustivelService } from './processo-combustivel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProcessoCombustivelDto, UpdateProcessoCombustivelDto } from './dto';

@ApiTags('Processo Combustível')
@Controller('processo-combustivel')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProcessoCombustivelController {
  constructor(private readonly processoCombustivelService: ProcessoCombustivelService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo processo combustível' })
  @ApiResponse({ status: 201, description: 'Processo combustível criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Processo ou combustível não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe um registro de combustível para este processo' })
  async create(@Body() createDto: CreateProcessoCombustivelDto) {
    return this.processoCombustivelService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar processos combustíveis com filtros opcionais' })
  @ApiResponse({ status: 200, description: 'Lista de processos combustíveis retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página para paginação', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página', example: 10 })
  @ApiQuery({ name: 'processoId', required: false, description: 'Filtrar por processo', example: 1 })
  @ApiQuery({ name: 'combustivelId', required: false, description: 'Filtrar por combustível', example: 1 })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('processoId') processoId?: string,
    @Query('combustivelId') combustivelId?: string,
  ) {
    return this.processoCombustivelService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      processoId ? parseInt(processoId) : undefined,
      combustivelId ? parseInt(combustivelId) : undefined,
    );
  }

  @Get('processo/:processoId')
  @ApiOperation({ 
    summary: 'Listar combustíveis e dados da tabela processoCombustivel por processoId',
    description: 'Retorna todos os combustíveis vinculados a um processo específico, incluindo os dados da tabela processoCombustivel (quantidade_litros, valor_unitario, saldo_bloqueado_processo, saldo_disponivel_processo)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Combustíveis do processo encontrados com sucesso',
    schema: {
      example: {
        message: 'Combustíveis do processo encontrados com sucesso',
        processo: {
          id: 1,
          numero_processo: 'PROC-2024-001',
          tipo_contrato: 'OBJETIVO',
          status: 'ATIVO'
        },
        combustiveis: [
          {
            id: 1,
            processoId: 1,
            combustivelId: 1,
            quantidade_litros: 1000.50,
            valor_unitario: 5.50,
            saldo_bloqueado_processo: 100.00,
            saldo_disponivel_processo: 900.50,
            combustivel: {
              id: 1,
              nome: 'Gasolina',
              sigla: 'GAS',
              descricao: 'Gasolina comum',
              ativo: true
            }
          }
        ],
        total: 1
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Processo não encontrado' })
  async findByProcessoId(@Param('processoId', ParseIntPipe) processoId: number) {
    return this.processoCombustivelService.findByProcessoId(processoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar processo combustível por ID' })
  @ApiResponse({ status: 200, description: 'Processo combustível encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Processo combustível não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.processoCombustivelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar processo combustível' })
  @ApiResponse({ status: 200, description: 'Processo combustível atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Processo combustível não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe um registro de combustível para este processo' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProcessoCombustivelDto,
  ) {
    return this.processoCombustivelService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir processo combustível' })
  @ApiResponse({ status: 200, description: 'Processo combustível excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Processo combustível não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir: existem aditivos vinculados' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.processoCombustivelService.remove(id);
  }
}

