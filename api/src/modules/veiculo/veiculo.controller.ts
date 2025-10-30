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
import { VeiculoService } from './veiculo.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { FindVeiculoDto } from './dto/find-veiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';

@ApiTags('Veículos')
@Controller('veiculos')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo' })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Veículo já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar veículo' })
  async create(@Body() createVeiculoDto: CreateVeiculoDto, @Request() req) {
    return this.veiculoService.create(createVeiculoDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'placa', required: false, description: 'Filtrar por placa' })
  @ApiQuery({ name: 'modelo', required: false, description: 'Filtrar por modelo' })
  @ApiQuery({ name: 'tipo_veiculo', required: false, description: 'Filtrar por tipo de veículo' })
  @ApiQuery({ name: 'situacao_veiculo', required: false, description: 'Filtrar por situação do veículo' })
  @ApiQuery({ name: 'tipo_abastecimento', required: false, description: 'Filtrar por tipo de abastecimento' })
  @ApiQuery({ name: 'periodicidade', required: false, description: 'Filtrar por periodicidade' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'orgaoId', required: false, description: 'Filtrar por órgão' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findVeiculoDto: FindVeiculoDto, @Request() req) {
    return this.veiculoService.findAll(findVeiculoDto, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.veiculoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVeiculoDto: UpdateVeiculoDto,
  ) {
    return this.veiculoService.update(id, updateVeiculoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir veículo' })
  @ApiResponse({ status: 200, description: 'Veículo excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir veículo com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.veiculoService.remove(id);
  }
}
