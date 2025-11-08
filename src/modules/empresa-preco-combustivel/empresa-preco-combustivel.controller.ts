import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmpresaPrecoCombustivelService } from './empresa-preco-combustivel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminEmpresaGuard } from '../auth/guards/admin-empresa.guard';
import { CreateEmpresaPrecoCombustivelDto } from './dto/create-empresa-preco-combustivel.dto';
import { UpdateEmpresaPrecoCombustivelDto } from './dto/update-empresa-preco-combustivel.dto';
import { FindEmpresaPrecoCombustivelDto } from './dto/find-empresa-preco-combustivel.dto';
import { UpdatePrecoAtualDto } from './dto/update-preco-atual.dto';
import { EmpresaPrecoCombustivelUsuarioSemEmpresaException } from '../../common/exceptions';

@ApiTags('Preços de Combustível por Empresa')
@Controller('empresa-preco-combustivel')
@UseGuards(JwtAuthGuard, AdminEmpresaGuard)
@ApiBearerAuth()
export class EmpresaPrecoCombustivelController {
  constructor(private readonly empresaPrecoCombustivelService: EmpresaPrecoCombustivelService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo preço de combustível para empresa' })
  @ApiResponse({ status: 201, description: 'Preço criado com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa ou combustível não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe um preço ativo para esta empresa e combustível' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode criar preços' })
  async create(@Body() createDto: CreateEmpresaPrecoCombustivelDto, @Request() req) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('create', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    return this.empresaPrecoCombustivelService.create(createDto, empresaId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar preços de combustível da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de preços retornada com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode listar preços' })
  async findAll(@Query() filters: FindEmpresaPrecoCombustivelDto, @Request() req) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('list', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    return this.empresaPrecoCombustivelService.findAll(filters, empresaId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar preço de combustível por ID' })
  @ApiResponse({ status: 200, description: 'Preço encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode visualizar preços' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('detail', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    return this.empresaPrecoCombustivelService.findOne(id, empresaId);
  }

  @Patch('preco-atual')
  @ApiOperation({ 
    summary: 'Atualizar preço atual do combustível',
    description: 'Atualiza o preço atual do combustível consultando automaticamente os dados da ANP (teto_vigente, anp_base, anp_base_valor, margem_app_pct, uf_referencia) da semana ANP ativa para a UF da empresa do usuário logado.'
  })
  @ApiResponse({ status: 200, description: 'Preço atual atualizado com sucesso' })
  @ApiResponse({ status: 201, description: 'Preço criado com sucesso (se não existia)' })
  @ApiResponse({ status: 404, description: 'Empresa, combustível, semana ANP ou preço ANP não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou preço ANP incompleto' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode atualizar preços' })
  async updatePrecoAtual(@Body() updatePrecoDto: UpdatePrecoAtualDto, @Request() req) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('updatePreco', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    const userName = req.user.nome || req.user.email;
    return this.empresaPrecoCombustivelService.updatePrecoAtual(updatePrecoDto, empresaId, userName);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar preço de combustível' })
  @ApiResponse({ status: 200, description: 'Preço atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode atualizar preços' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEmpresaPrecoCombustivelDto,
    @Request() req,
  ) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('update', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    return this.empresaPrecoCombustivelService.update(id, updateDto, empresaId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir preço de combustível' })
  @ApiResponse({ status: 200, description: 'Preço excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Preço não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA pode excluir preços' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const empresaId = req.user.empresa?.id;
    if (!empresaId) {
      throw new EmpresaPrecoCombustivelUsuarioSemEmpresaException('delete', {
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo: req.user?.perfil?.tipo ?? req.user?.perfil,
        },
      });
    }
    return this.empresaPrecoCombustivelService.remove(id, empresaId);
  }
}

