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
import { AbastecimentoService } from './abastecimento.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaGuard } from '../auth/guards/empresa.guard';
import { BadRequestException } from '@nestjs/common';

@ApiTags('Abastecimentos')
@Controller('abastecimentos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AbastecimentoController {
  constructor(private readonly abastecimentoService: AbastecimentoService) {}

  @Post()
  @UseGuards(EmpresaGuard)
  @ApiOperation({ summary: 'Criar novo abastecimento' })
  @ApiResponse({ status: 201, description: 'Abastecimento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos' })
  async create(
    @Body() createAbastecimentoDto: CreateAbastecimentoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.create(createAbastecimentoDto, req.user);
  }

  @Post('from-solicitacao')
  @UseGuards(EmpresaGuard)
  @ApiOperation({ 
    summary: 'Criar abastecimento a partir de uma solicitação de abastecimento',
    description: 'Cria um abastecimento a partir de uma solicitação. Se a solicitação estiver PENDENTE, será automaticamente aprovada antes de criar o abastecimento. Após criar o abastecimento, a solicitação permanecerá com status APROVADA e será vinculada ao abastecimento criado.'
  })
  @ApiResponse({ status: 201, description: 'Abastecimento criado a partir da solicitação com sucesso. Se a solicitação estava PENDENTE, foi aprovada automaticamente.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos, solicitação expirada, rejeitada ou inativa' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 409, description: 'Solicitação já possui abastecimento vinculado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos' })
  async createFromSolicitacao(
    @Body() createDto: CreateAbastecimentoFromSolicitacaoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.createFromSolicitacao(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar abastecimentos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de abastecimentos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'veiculoId', required: false, description: 'Filtrar por veículo' })
  @ApiQuery({ name: 'motoristaId', required: false, description: 'Filtrar por motorista' })
  @ApiQuery({ name: 'combustivelId', required: false, description: 'Filtrar por combustível' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por empresa' })
  @ApiQuery({ name: 'tipo_abastecimento', required: false, description: 'Filtrar por tipo de abastecimento' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'data_inicial', required: false, description: 'Data inicial para filtro' })
  @ApiQuery({ name: 'data_final', required: false, description: 'Data final para filtro' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findAbastecimentoDto: FindAbastecimentoDto) {
    return this.abastecimentoService.findAll(findAbastecimentoDto);
  }

  @Get('veiculo/tipo/abastecimento/:veiculoId/:qntLitros')
  @ApiOperation({ 
    summary: 'Verificar tipo de abastecimento e cota do veículo',
    description: 'Verifica se a quantidade de litros informada excede a cota do veículo. Retorna informações sobre o consumo no período (diário, semanal ou mensal) baseado na periodicidade configurada no veículo. Considera apenas abastecimentos aprovados no período.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informações sobre a cota do veículo retornadas com sucesso',
    schema: {
      example: {
        message: 'A quantidade solicitada (30.0 litros) está dentro da cota diária do veículo. Cota disponível: 70.00 litros. Limite: 100.00 litros. Quantidade já utilizada no período: 30.00 litros. Após este abastecimento, restará: 40.00 litros.',
        excedeu: false,
        veiculo: {
          id: 1,
          nome: 'Veículo 1',
          placa: 'ABC-1234',
          tipo_abastecimento: 'COTA',
          periodicidade: 'Diario',
          periodicidadeNome: 'Diária'
        },
        cota: {
          quantidadeLimite: 100,
          quantidadeUtilizada: 30,
          quantidadeDisponivel: 70,
          quantidadeSolicitada: 30,
          novaQuantidadeTotal: 60,
          excedeuPor: 0
        },
        periodo: {
          inicio: '2025-01-15T00:00:00.000Z',
          fim: '2025-01-15T23:59:59.999Z',
          tipo: 'Diária'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Quantidade de litros inválida' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async verificarTipoAbastecimentoVeiculo(
    @Param('veiculoId', ParseIntPipe) veiculoId: number,
    @Param('qntLitros') qntLitrosParam: string,
  ) {
    const qntLitros = parseFloat(qntLitrosParam);
    
    if (isNaN(qntLitros) || qntLitros <= 0) {
      throw new BadRequestException('Quantidade de litros deve ser um número positivo maior que zero');
    }
    
    return this.abastecimentoService.verificarTipoAbastecimentoVeiculo(veiculoId, qntLitros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar abastecimento por ID' })
  @ApiResponse({ status: 200, description: 'Abastecimento encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.abastecimentoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbastecimentoDto: UpdateAbastecimentoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.update(id, updateAbastecimentoDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.abastecimentoService.remove(id, req.user);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento aprovado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação ou já foi processado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.abastecimentoService.approve(id, req.user.id, req.user.email, req.user);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeitar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento rejeitado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação, motivo da rejeição não informado ou já foi processado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.abastecimentoService.reject(id, req.user.id, req.user.email, motivo, req.user);
  }
}
