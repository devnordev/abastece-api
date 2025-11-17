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
import { UpdateStatusSolicitacaoDto } from './dto/update-status-solicitacao.dto';
import { FindSolicitacaoAbastecimentoDto } from './dto/find-solicitacao-abastecimento.dto';
import { GetPrecoCombustivelDto } from './dto/get-preco-combustivel.dto';
import { ValidarCapacidadeTanqueDto } from './dto/validar-capacidade-tanque.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraEmpresaGuard } from '../auth/guards/admin-prefeitura-empresa.guard';
import { AdminPrefeituraEmpresaColaboradorGuard } from '../auth/guards/admin-prefeitura-empresa-colaborador.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';

@ApiTags('Solicitações de Abastecimento')
@Controller({ path: ['solicitacoes-abastecimento', 'solicitacoes'] })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SolicitacaoAbastecimentoController {
  constructor(private readonly solicitacaoService: SolicitacaoAbastecimentoService) {}

  @Post()
  @UseGuards(AdminPrefeituraEmpresaGuard)
  @ApiOperation({ summary: 'Criar solicitação de abastecimento' })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso' })
  async create(@Body() createDto: CreateSolicitacaoAbastecimentoDto) {
    return this.solicitacaoService.create(createDto);
  }

  @Get()
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ 
    summary: 'Listar solicitações de abastecimento',
    description: 'Para ADMIN_PREFEITURA: lista solicitações da prefeitura do usuário. Para ADMIN_EMPRESA ou COLABORADOR_EMPRESA: lista solicitações da empresa do usuário. O parâmetro empresaId na query é opcional e, quando fornecido, deve corresponder à empresa do usuário. Exemplo: GET /solicitacoes-abastecimento?empresaId={empresaId}&limit=1000'
  })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Usuário não está vinculado a uma prefeitura/empresa ativa ou empresaId fornecido não corresponde à empresa do usuário' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_PREFEITURA, ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem acessar' })
  async findAllByPrefeitura(
    @Query() query: FindSolicitacaoAbastecimentoDto,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.findAllByPrefeitura(req.user, query);
  }

  @Get('preco-combustivel')
  @ApiOperation({
    summary: 'Obter preço atual do combustível para uma empresa',
    description: 'Retorna o preço atual (preco_atual) do combustível cadastrado no model EmpresaPrecoCombustivel com status ACTIVE',
  })
  @ApiResponse({
    status: 200,
    description: 'Preço do combustível recuperado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Combustível, empresa ou preço não encontrado',
  })
  async obterPrecoCombustivel(@Query() query: GetPrecoCombustivelDto) {
    return this.solicitacaoService.obterPrecoCombustivel(query.combustivelId, query.empresaId);
  }

  @Get('veiculo/orgao/prefeitura')
  @UseGuards(AdminPrefeituraGuard)
  @ApiOperation({ summary: 'Listar veículos vinculados aos órgãos da prefeitura do usuário' })
  @ApiResponse({ status: 200, description: 'Veículos retornados com sucesso' })
  async listarVeiculosOrgaosDaPrefeitura(@Req() req: Request & { user: any }) {
    return this.solicitacaoService.listarVeiculosOrgaosDaPrefeitura(req.user);
  }

  @Get('empresas/credenciadas')
  @UseGuards(AdminPrefeituraGuard)
  @ApiOperation({ summary: 'Listar empresas credenciadas da prefeitura do usuário' })
  @ApiResponse({ status: 200, description: 'Empresas credenciadas retornadas com sucesso' })
  async listarEmpresasCredenciadas(@Req() req: Request & { user: any }) {
    return this.solicitacaoService.listarEmpresasCredenciadas(req.user);
  }

  @Get('combustivel/:combustivelId/preco')
  @ApiOperation({
    summary: 'Obter preço atual do combustível por ID',
    description: 'Retorna o preço atual (preco_atual) do combustível cadastrado no model EmpresaPrecoCombustivel com status ACTIVE mais recente',
  })
  @ApiResponse({
    status: 200,
    description: 'Preço do combustível recuperado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Combustível ou preço não encontrado',
  })
  async obterPrecoCombustivelPorId(@Param('combustivelId', ParseIntPipe) combustivelId: number) {
    return this.solicitacaoService.obterPrecoCombustivelPorId(combustivelId);
  }

  @Post('validar-capacidade-tanque')
  @ApiOperation({
    summary: 'Validar se a quantidade é menor ou igual à capacidade do tanque do veículo',
    description: 'Verifica se a quantidade informada é menor ou igual à capacidade do tanque do veículo. Retorna mensagem positiva se válido, ou mensagem informando que não é possível se a quantidade exceder a capacidade.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação realizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Veículo não encontrado',
  })
  async validarCapacidadeTanque(@Body() dto: ValidarCapacidadeTanqueDto) {
    return this.solicitacaoService.validarCapacidadeTanque(dto.veiculoId, dto.quantidade);
  }

  @Get('veiculo/:id/tipo-abastecimento')
  @UseGuards(AdminPrefeituraGuard)
  @ApiOperation({ summary: 'Obter tipo de abastecimento de um veículo da prefeitura' })
  @ApiResponse({ status: 200, description: 'Tipo de abastecimento retornado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado ou não vinculado à prefeitura' })
  async obterTipoAbastecimento(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.obterTipoAbastecimentoVeiculo(id, req.user);
  }

  @Get('orgao/:orgaoId/cotas')
  @UseGuards(AdminPrefeituraGuard)
  @ApiOperation({ summary: 'Listar cotas de combustível do órgão dentro da prefeitura do usuário' })
  @ApiResponse({ status: 200, description: 'Cotas retornadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Órgão não encontrado para a prefeitura do usuário' })
  async listarCotasDoOrgao(
    @Param('orgaoId', ParseIntPipe) orgaoId: number,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.listarCotasDoOrgao(orgaoId, req.user);
  }

  @Get('empresas/:empresaId/combustiveis')
  @ApiOperation({ summary: 'Listar combustíveis credenciados de uma empresa' })
  @ApiResponse({ status: 200, description: 'Combustíveis credenciados retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada ou inativa' })
  async listarCombustiveisCredenciados(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.listarCombustiveisCredenciados(empresaId, req.user);
  }

  @Get(':id')
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Buscar solicitação de abastecimento por ID' })
  @ApiResponse({ status: 200, description: 'Solicitação encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.solicitacaoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminPrefeituraEmpresaGuard)
  @ApiOperation({ summary: 'Atualizar solicitação de abastecimento' })
  @ApiResponse({ status: 200, description: 'Solicitação atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSolicitacaoAbastecimentoDto,
  ) {
    return this.solicitacaoService.update(id, updateDto);
  }

  @Patch(':id/status')
  @UseGuards(AdminPrefeituraEmpresaGuard)
  @ApiOperation({ summary: 'Alterar status da solicitação de abastecimento' })
  @ApiResponse({ status: 200, description: 'Status da solicitação alterado com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusSolicitacaoDto,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.updateStatus(id, updateStatusDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AdminPrefeituraEmpresaGuard)
  @ApiOperation({ summary: 'Excluir solicitação de abastecimento' })
  @ApiResponse({ status: 200, description: 'Solicitação excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.solicitacaoService.remove(id);
  }
}

