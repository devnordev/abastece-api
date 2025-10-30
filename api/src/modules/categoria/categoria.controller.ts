import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriaService } from './categoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Categorias')
@Controller('categorias')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  async create(@Body() data: { prefeituraId: number; tipo_categoria: any; nome: string; descricao?: string; ativo?: boolean }) {
    return this.categoriaService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias retornada com sucesso' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('prefeituraId') prefeituraId?: string,
    @Query('tipo_categoria') tipo_categoria?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.categoriaService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      prefeituraId ? parseInt(prefeituraId) : undefined,
      tipo_categoria as any,
      ativo ? ativo === 'true' : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada com sucesso' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nome?: string; descricao?: string; ativo?: boolean },
  ) {
    return this.categoriaService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir categoria' })
  @ApiResponse({ status: 200, description: 'Categoria excluída com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.remove(id);
  }
}
