import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgaoService } from './orgao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';

@ApiTags('Órgãos')
@Controller('orgaos')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class OrgaoController {
  constructor(private readonly orgaoService: OrgaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo órgão' })
  @ApiResponse({ status: 201, description: 'Órgão criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar órgão' })
  @ApiResponse({ status: 409, description: 'Órgão já existe nesta prefeitura' })
  async create(@Body() data: { prefeituraId: number; nome: string; sigla: string; ativo?: boolean }, @Request() req) {
    return this.orgaoService.create(data, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órgãos' })
  @ApiResponse({ status: 200, description: 'Lista de órgãos retornada com sucesso' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('prefeituraId') prefeituraId?: string,
    @Query('ativo') ativo?: string,
  ) {
    return this.orgaoService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      prefeituraId ? parseInt(prefeituraId) : undefined,
      ativo ? ativo === 'true' : undefined,
      req.user?.id,
    );
  }

  @Get(':id/veiculos')
  @ApiOperation({ summary: 'Listar veículos de um órgão' })
  @ApiResponse({ status: 200, description: 'Lista de veículos do órgão retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Órgão não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar este órgão' })
  async findVeiculosByOrgao(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orgaoService.findVeiculosByOrgao(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      req.user?.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar órgão por ID' })
  @ApiResponse({ status: 200, description: 'Órgão encontrado com sucesso' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orgaoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar órgão' })
  @ApiResponse({ status: 200, description: 'Órgão atualizado com sucesso' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nome?: string; sigla?: string; ativo?: boolean },
  ) {
    return this.orgaoService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir órgão' })
  @ApiResponse({ status: 200, description: 'Órgão excluído com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgaoService.remove(id);
  }
}
