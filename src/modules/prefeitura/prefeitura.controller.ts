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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrefeituraService } from './prefeitura.service';
import { CreatePrefeituraDto } from './dto/create-prefeitura.dto';
import { UpdatePrefeituraDto } from './dto/update-prefeitura.dto';
import { FindPrefeituraDto } from './dto/find-prefeitura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Prefeituras')
@Controller('prefeituras')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrefeituraController {
  constructor(private readonly prefeituraService: PrefeituraService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova prefeitura' })
  @ApiResponse({ status: 201, description: 'Prefeitura criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Prefeitura já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createPrefeituraDto: CreatePrefeituraDto) {
    return this.prefeituraService.create(createPrefeituraDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar prefeituras com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de prefeituras retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'cnpj', required: false, description: 'Filtrar por CNPJ' })
  @ApiQuery({ name: 'email_administrativo', required: false, description: 'Filtrar por email administrativo' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findPrefeituraDto: FindPrefeituraDto) {
    return this.prefeituraService.findAll(findPrefeituraDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar prefeitura por ID' })
  @ApiResponse({ status: 200, description: 'Prefeitura encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prefeituraService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar prefeitura' })
  @ApiResponse({ status: 200, description: 'Prefeitura atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 409, description: 'CNPJ ou email já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePrefeituraDto: UpdatePrefeituraDto,
  ) {
    return this.prefeituraService.update(id, updatePrefeituraDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir prefeitura' })
  @ApiResponse({ status: 200, description: 'Prefeitura excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir prefeitura com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prefeituraService.remove(id);
  }
}
