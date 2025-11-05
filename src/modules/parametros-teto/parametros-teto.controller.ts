import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParametrosTetoService } from './parametros-teto.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CreateParametrosTetoDto } from './dto/create-parametros-teto.dto';
import { UpdateParametrosTetoDto } from './dto/update-parametros-teto.dto';

@ApiTags('Parâmetros Teto')
@Controller('parametros-teto')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class ParametrosTetoController {
  constructor(private readonly parametrosTetoService: ParametrosTetoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo parâmetro de teto' })
  @ApiResponse({ status: 201, description: 'Parâmetro de teto criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async create(@Body() createParametrosTetoDto: CreateParametrosTetoDto) {
    return this.parametrosTetoService.create(createParametrosTetoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar parâmetros de teto' })
  @ApiResponse({ status: 200, description: 'Lista de parâmetros de teto retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findAll() {
    return this.parametrosTetoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar parâmetro de teto por ID' })
  @ApiResponse({ status: 200, description: 'Parâmetro de teto encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Parâmetro de teto não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parametrosTetoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar parâmetro de teto' })
  @ApiResponse({ status: 200, description: 'Parâmetro de teto atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Parâmetro de teto não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParametrosTetoDto: UpdateParametrosTetoDto,
  ) {
    return this.parametrosTetoService.update(id, updateParametrosTetoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir parâmetro de teto' })
  @ApiResponse({ status: 200, description: 'Parâmetro de teto excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Parâmetro de teto não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.parametrosTetoService.remove(id);
  }
}

