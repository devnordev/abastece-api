import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnpSemanaService } from './anp-semana.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CreateAnpSemanaDto } from './dto/create-anp-semana.dto';
import { UpdateAnpSemanaDto } from './dto/update-anp-semana.dto';

@ApiTags('ANP Semana')
@Controller('anp-semana')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class AnpSemanaController {
  constructor(private readonly anpSemanaService: AnpSemanaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova semana ANP' })
  @ApiResponse({ status: 201, description: 'Semana ANP criada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async create(@Body() createAnpSemanaDto: CreateAnpSemanaDto) {
    return this.anpSemanaService.create(createAnpSemanaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar semanas ANP' })
  @ApiResponse({ status: 200, description: 'Lista de semanas ANP retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findAll() {
    return this.anpSemanaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar semana ANP por ID' })
  @ApiResponse({ status: 200, description: 'Semana ANP encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Semana ANP não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.anpSemanaService.findOne(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Ativar semana ANP (desativa as outras automaticamente)' })
  @ApiResponse({ status: 200, description: 'Semana ANP ativada com sucesso' })
  @ApiResponse({ status: 404, description: 'Semana ANP não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async activate(@Param('id', ParseIntPipe) id: number) {
    return this.anpSemanaService.activate(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar semana ANP' })
  @ApiResponse({ status: 200, description: 'Semana ANP atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Semana ANP não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnpSemanaDto: UpdateAnpSemanaDto,
  ) {
    return this.anpSemanaService.update(id, updateAnpSemanaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir semana ANP' })
  @ApiResponse({ status: 200, description: 'Semana ANP excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Semana ANP não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.anpSemanaService.remove(id);
  }
}

