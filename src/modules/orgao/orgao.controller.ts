import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgaoService } from './orgao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';
import { CreateCotaOrgaoDto } from './dto/create-cota-orgao.dto';

@ApiTags('Órgãos')
@Controller('orgaos')
@UseGuards(JwtAuthGuard)
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

  @Post(':id/cotas')
  @UseGuards(AdminPrefeituraGuard)
  @ApiOperation({
    summary: 'Criar cota de combustível para um órgão (CotaOrgao)',
    description:
      'Cria um registro em CotaOrgao para o órgão informado, vinculando a um processo OBJETIVO da prefeitura do usuário logado. ' +
      'Valida que a soma das quantidades de todas as cotas do processo não ultrapassa litros_desejados do processo e que a soma das cotas por combustível não ultrapassa quantidade_litros do ProcessoCombustivel correspondente.',
  })
  @ApiResponse({ status: 201, description: 'Cota criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Regras de negócio da cota violadas' })
  @ApiResponse({ status: 403, description: 'Usuário não é ADMIN_PREFEITURA ou órgão de outra prefeitura' })
  @ApiResponse({ status: 404, description: 'Órgão ou processo não encontrado' })
  async createCotaOrgao(
    @Param('id', ParseIntPipe) orgaoId: number,
    @Body() dto: CreateCotaOrgaoDto,
    @Request() req,
  ) {
    return this.orgaoService.createCotaOrgao(orgaoId, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir órgão' })
  @ApiResponse({ status: 200, description: 'Órgão excluído com sucesso' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgaoService.remove(id);
  }
}
