import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContratoService } from './contrato.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contratos')
@Controller('contratos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContratoController {
  constructor(private readonly contratoService: ContratoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo contrato' })
  @ApiResponse({ status: 201, description: 'Contrato criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Esta empresa já possui um contrato cadastrado' })
  async create(@Body() data: any) {
    return this.contratoService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos' })
  @ApiResponse({ status: 200, description: 'Lista de contratos retornada com sucesso' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('empresaId') empresaId?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.contratoService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      empresaId ? parseInt(empresaId) : undefined,
      ativo ? ativo === 'true' : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar contrato por ID' })
  @ApiResponse({ status: 200, description: 'Contrato encontrado com sucesso' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contratoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contrato' })
  @ApiResponse({ status: 200, description: 'Contrato atualizado com sucesso' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.contratoService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir contrato' })
  @ApiResponse({ status: 200, description: 'Contrato excluído com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contratoService.remove(id);
  }
}
