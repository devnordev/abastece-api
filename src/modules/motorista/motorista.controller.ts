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
import { MotoristaService } from './motorista.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { FindMotoristaDto } from './dto/find-motorista.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';

@ApiTags('Motoristas')
@Controller('motoristas')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class MotoristaController {
  constructor(private readonly motoristaService: MotoristaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo motorista' })
  @ApiResponse({ status: 201, description: 'Motorista criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Motorista já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar motorista' })
  async create(@Body() createMotoristaDto: CreateMotoristaDto, @Request() req) {
    return this.motoristaService.create(createMotoristaDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar motoristas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de motoristas retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'cpf', required: false, description: 'Filtrar por CPF' })
  @ApiQuery({ name: 'cnh', required: false, description: 'Filtrar por CNH' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findMotoristaDto: FindMotoristaDto, @Request() req) {
    return this.motoristaService.findAll(findMotoristaDto, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar motorista por ID' })
  @ApiResponse({ status: 200, description: 'Motorista encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.motoristaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar motorista' })
  @ApiResponse({ status: 200, description: 'Motorista atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 409, description: 'CPF já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMotoristaDto: UpdateMotoristaDto,
  ) {
    return this.motoristaService.update(id, updateMotoristaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir motorista' })
  @ApiResponse({ status: 200, description: 'Motorista excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir motorista com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.motoristaService.remove(id);
  }
}
