import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegraAlertaService } from './regra-alerta.service';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('Regras de Alerta')
@ApiBearerAuth()
@Controller('regras-alerta')
@UseGuards(JwtAuthGuard)
export class RegraAlertaController {
  constructor(private readonly regraAlertaService: RegraAlertaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Criar uma nova regra de alerta (apenas SUPER_ADMIN)' })
  create(@Body() createRegraAlertaDto: CreateRegraAlertaDto) {
    return this.regraAlertaService.create(createRegraAlertaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as regras de alerta' })
  findAll(@Query('ativo') ativo?: string) {
    const ativoBool = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    return this.regraAlertaService.findAll(ativoBool);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Buscar uma regra de alerta por ID' })
  findOne(@Param('id') id: string) {
    return this.regraAlertaService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Atualizar uma regra de alerta' })
  update(@Param('id') id: string, @Body() updateRegraAlertaDto: UpdateRegraAlertaDto) {
    return this.regraAlertaService.update(+id, updateRegraAlertaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiOperation({ summary: 'Excluir uma regra de alerta' })
  remove(@Param('id') id: string) {
    return this.regraAlertaService.remove(+id);
  }
}

