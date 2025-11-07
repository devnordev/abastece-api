import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CombustivelService } from './combustivel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CombustivelListGuard } from '../auth/guards/combustivel-list.guard';

@ApiTags('Combustíveis')
@Controller('combustiveis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombustivelController {
  constructor(private readonly combustivelService: CombustivelService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Criar novo combustível' })
  @ApiResponse({ status: 201, description: 'Combustível criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode criar combustíveis' })
  async create(@Body() data: { nome: string; sigla: string; descricao?: string; observacoes?: string }) {
    return this.combustivelService.create(data);
  }

  @Get()
  @UseGuards(CombustivelListGuard)
  @ApiOperation({ summary: 'Listar combustíveis' })
  @ApiResponse({ status: 200, description: 'Lista de combustíveis retornada com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN ou ADMIN_EMPRESA podem listar combustíveis' })
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
  @UseGuards(CombustivelListGuard)
  @ApiOperation({ summary: 'Buscar combustível por ID' })
  @ApiResponse({ status: 200, description: 'Combustível encontrado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN ou ADMIN_EMPRESA podem visualizar combustíveis' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.combustivelService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Atualizar combustível' })
  @ApiResponse({ status: 200, description: 'Combustível atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode atualizar combustíveis' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nome?: string; sigla?: string; descricao?: string; observacoes?: string; ativo?: boolean },
  ) {
    return this.combustivelService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Excluir combustível' })
  @ApiResponse({ status: 200, description: 'Combustível excluído com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode excluir combustíveis' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.combustivelService.remove(id);
  }
}
