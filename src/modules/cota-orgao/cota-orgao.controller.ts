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
import { CotaOrgaoService } from './cota-orgao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';
import { CreateCotaOrgaoDto, UpdateCotaOrgaoDto } from './dto';

@ApiTags('Cotas de Órgão')
@Controller('cota-orgao')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN', 'COLABORADOR_PREFEITURA', 'ADMIN_EMPRESA', 'COLABORADOR_EMPRESA']))
@ApiBearerAuth()
export class CotaOrgaoController {
  constructor(private readonly cotaOrgaoService: CotaOrgaoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova cota de órgão' })
  @ApiResponse({ status: 201, description: 'Cota de órgão criada com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar cota de órgão' })
  @ApiResponse({ status: 404, description: 'Processo, órgão ou combustível não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe uma cota para este órgão e combustível neste processo' })
  @ApiResponse({ status: 400, description: 'Quantidade excede a disponível no processo ou dados inválidos' })
  async create(@Body() createDto: CreateCotaOrgaoDto, @Request() req) {
    return this.cotaOrgaoService.create(createDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotas de órgão' })
  @ApiResponse({ status: 200, description: 'Lista de cotas de órgão retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({ name: 'processoId', required: false, type: Number, description: 'Filtrar por processo' })
  @ApiQuery({ name: 'orgaoId', required: false, type: Number, description: 'Filtrar por órgão' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('processoId') processoId?: string,
    @Query('orgaoId') orgaoId?: string,
  ) {
    return this.cotaOrgaoService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      processoId ? parseInt(processoId) : undefined,
      orgaoId ? parseInt(orgaoId) : undefined,
      req.user?.id,
    );
  }

  @Get('orgao/:orgaoId')
  @ApiOperation({ summary: 'Listar cotas de um órgão específico' })
  @ApiResponse({ status: 200, description: 'Lista de cotas do órgão retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Órgão não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar cotas deste órgão' })
  async findByOrgaoId(@Param('orgaoId', ParseIntPipe) orgaoId: number, @Request() req) {
    return this.cotaOrgaoService.findByOrgaoId(orgaoId, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cota de órgão por ID' })
  @ApiResponse({ status: 200, description: 'Cota de órgão encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cota de órgão não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar esta cota de órgão' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cotaOrgaoService.findOne(id, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cota de órgão' })
  @ApiResponse({ status: 200, description: 'Cota de órgão atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cota de órgão não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para atualizar esta cota de órgão' })
  @ApiResponse({ status: 400, description: 'Quantidade excede a disponível ou é menor que a utilizada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCotaOrgaoDto,
    @Request() req,
  ) {
    return this.cotaOrgaoService.update(id, updateDto, req.user?.id);
  }

  @Patch(':id/ativar')
  @ApiOperation({ summary: 'Ativar cota de órgão' })
  @ApiResponse({ status: 200, description: 'Cota de órgão ativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cota de órgão não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para ativar esta cota de órgão' })
  @ApiResponse({ status: 400, description: 'Cota já está ativa' })
  async ativar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cotaOrgaoService.ativar(id, req.user?.id);
  }

  @Patch(':id/desativar')
  @ApiOperation({ summary: 'Desativar cota de órgão' })
  @ApiResponse({ status: 200, description: 'Cota de órgão desativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cota de órgão não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para desativar esta cota de órgão' })
  @ApiResponse({ status: 400, description: 'Cota já está desativada' })
  async desativar(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cotaOrgaoService.desativar(id, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir cota de órgão' })
  @ApiResponse({ status: 200, description: 'Cota de órgão excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Cota de órgão não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir esta cota de órgão' })
  @ApiResponse({ status: 409, description: 'Não é possível excluir: há abastecimentos vinculados' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.cotaOrgaoService.remove(id, req.user?.id);
  }
}

