import { Controller, Get, Query, UseGuards, Param, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraEmpresaColaboradorGuard } from '../auth/guards/admin-prefeitura-empresa-colaborador.guard';
import { EmpresaGuard } from '../auth/guards/empresa.guard';
import { EmpresaPrecoCombustivelService } from '../empresa-preco-combustivel/empresa-preco-combustivel.service';
import { GetPrecoEmpresaCombustivelDto } from '../empresa-preco-combustivel/dto/get-preco-empresa-combustivel.dto';
import { AppService } from './app.service';

@ApiTags('App - Solicitações')
@Controller('app')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppController {
  constructor(
    private readonly empresaPrecoCombustivelService: EmpresaPrecoCombustivelService,
    private readonly appService: AppService,
  ) {}

  @Get('solicitacao/preco-empresa/combustivel')
  @ApiOperation({ 
    summary: 'Buscar preço atual do combustível por empresa',
    description: 'Retorna o preço atual do combustível para a empresa selecionada. Retorna erro se o combustível não estiver disponível na empresa.'
  })
  @ApiQuery({ name: 'empresaId', required: true, type: Number, description: 'ID da empresa' })
  @ApiQuery({ name: 'combustivelId', required: true, type: Number, description: 'ID do combustível' })
  @ApiResponse({ 
    status: 200, 
    description: 'Preço atual encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Preço atual encontrado com sucesso' },
        preco_atual: { type: 'number', example: 5.89 },
        combustivel: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nome: { type: 'string', example: 'Gasolina Comum' },
            sigla: { type: 'string', example: 'G' },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Não temos esse combustível disponível na empresa selecionada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Não temos esse combustível disponível na empresa selecionada' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getPrecoEmpresaCombustivel(@Query() query: GetPrecoEmpresaCombustivelDto) {
    return this.empresaPrecoCombustivelService.findPrecoAtualByEmpresaAndCombustivel(
      query.empresaId,
      query.combustivelId,
    );
  }

  @Get('veiculo/:veiculoId')
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ 
    summary: 'Listar combustíveis permitidos para solicitação de abastecimento de um veículo',
    description: 'Retorna os combustíveis que o veículo pode solicitar (que estão cadastrados no veículo e na cota do órgão) e todos os combustíveis da cota do órgão. Apenas permite acesso a veículos da prefeitura do usuário logado.'
  })
  @ApiParam({ name: 'veiculoId', type: Number, description: 'ID do veículo' })
  @ApiResponse({ status: 200, description: 'Combustíveis permitidos retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 403, description: 'Você não tem permissão para acessar veículos de outras prefeituras' })
  async listarCombustiveisPermitidosParaVeiculo(
    @Param('veiculoId', ParseIntPipe) veiculoId: number,
    @Req() req: Request & { user: any },
  ) {
    return this.appService.listarCombustiveisPermitidosParaVeiculo(veiculoId, req.user);
  }

  @Get('empresa/preco/:combustivelId')
  @UseGuards(EmpresaGuard)
  @ApiOperation({ 
    summary: 'Verificar se a empresa do usuário tem preço para um combustível',
    description: 'Verifica se a empresa do usuário logado possui preço cadastrado (empresaPrecoCombustivel com status ACTIVE) para o combustível informado. Retorna informações do preço se existir. Apenas usuários de empresa (ADMIN_EMPRESA ou COLABORADOR_EMPRESA) podem acessar esta rota.'
  })
  @ApiParam({ name: 'combustivelId', type: Number, description: 'ID do combustível' })
  @ApiResponse({ 
    status: 200, 
    description: 'Preço verificado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        possuiPreco: { type: 'boolean' },
        empresa: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            nome: { type: 'string' },
            cnpj: { type: 'string' },
          },
        },
        combustivel: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            nome: { type: 'string' },
            sigla: { type: 'string' },
          },
        },
        preco: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            preco_atual: { type: 'number' },
            teto_vigente: { type: 'number' },
            anp_base: { type: 'string' },
            anp_base_valor: { type: 'number' },
            margem_app_pct: { type: 'number' },
            uf_referencia: { type: 'string' },
            status: { type: 'string' },
            updated_at: { type: 'string' },
            updated_by: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Apenas usuários de empresa (ADMIN_EMPRESA ou COLABORADOR_EMPRESA) têm acesso a este recurso' })
  @ApiResponse({ status: 404, description: 'Combustível ou empresa não encontrado' })
  async verificarPrecoCombustivelEmpresa(
    @Param('combustivelId', ParseIntPipe) combustivelId: number,
    @Req() req: Request & { user: any },
  ) {
    return this.appService.verificarPrecoCombustivelEmpresa(combustivelId, req.user);
  }
}

