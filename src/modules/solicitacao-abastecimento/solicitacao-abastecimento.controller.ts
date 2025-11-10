import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SolicitacaoAbastecimentoService } from './solicitacao-abastecimento.service';
import { CreateSolicitacaoAbastecimentoDto } from './dto/create-solicitacao-abastecimento.dto';
import { UpdateSolicitacaoAbastecimentoDto } from './dto/update-solicitacao-abastecimento.dto';
import { FindSolicitacaoAbastecimentoDto } from './dto/find-solicitacao-abastecimento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';

@ApiTags('Solicitações de Abastecimento')
@Controller({ path: ['solicitacoes-abastecimento', 'solicitacoes'] })
@UseGuards(JwtAuthGuard, AdminPrefeituraGuard)
@ApiBearerAuth()
export class SolicitacaoAbastecimentoController {
  constructor(private readonly solicitacaoService: SolicitacaoAbastecimentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar solicitação de abastecimento' })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso' })
  async create(@Body() createDto: CreateSolicitacaoAbastecimentoDto) {
    return this.solicitacaoService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitações de abastecimento' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  async findAll(@Query() query: FindSolicitacaoAbastecimentoDto) {
    return this.solicitacaoService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar solicitação de abastecimento por ID' })
  @ApiResponse({ status: 200, description: 'Solicitação encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitacaoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar solicitação de abastecimento' })
  @ApiResponse({ status: 200, description: 'Solicitação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSolicitacaoAbastecimentoDto,
  ) {
    return this.solicitacaoService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir solicitação de abastecimento' })
  @ApiResponse({ status: 200, description: 'Solicitação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.solicitacaoService.remove(id);
  }

  @Get('veiculo/orgao/prefeitura')
  @ApiOperation({ summary: 'Listar veículos vinculados aos órgãos da prefeitura do usuário' })
  @ApiResponse({ status: 200, description: 'Veículos retornados com sucesso' })
  async listarVeiculosOrgaosDaPrefeitura(@Req() req: Request & { user: any }) {
    return this.solicitacaoService.listarVeiculosOrgaosDaPrefeitura(req.user);
  }
}

