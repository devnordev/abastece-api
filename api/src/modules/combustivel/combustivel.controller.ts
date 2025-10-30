import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CombustivelService } from './combustivel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Combustíveis')
@Controller('combustiveis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombustivelController {
  constructor(private readonly combustivelService: CombustivelService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo combustível' })
  @ApiResponse({ status: 201, description: 'Combustível criado com sucesso' })
  async create(@Body() data: { nome: string; sigla: string; descricao?: string; observacoes?: string }) {
    return this.combustivelService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar combustíveis' })
  @ApiResponse({ status: 200, description: 'Lista de combustíveis retornada com sucesso' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.combustivelService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      ativo ? ativo === 'true' : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar combustível por ID' })
  @ApiResponse({ status: 200, description: 'Combustível encontrado com sucesso' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.combustivelService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar combustível' })
  @ApiResponse({ status: 200, description: 'Combustível atualizado com sucesso' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nome?: string; sigla?: string; descricao?: string; observacoes?: string; ativo?: boolean },
  ) {
    return this.combustivelService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir combustível' })
  @ApiResponse({ status: 200, description: 'Combustível excluído com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.combustivelService.remove(id);
  }
}
