import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracaoAlertaService } from './configuracao-alerta.service';
import { CreateConfiguracaoAlertaDto } from './dto/create-configuracao-alerta.dto';
import { UpdateConfiguracaoAlertaDto } from './dto/update-configuracao-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminPrefeituraGuard } from '../auth/guards/super-admin-prefeitura.guard';

@ApiTags('Configurações de Alerta')
@ApiBearerAuth()
@Controller('configuracoes-alerta')
@UseGuards(JwtAuthGuard, SuperAdminPrefeituraGuard)
export class ConfiguracaoAlertaController {
  constructor(private readonly configuracaoAlertaService: ConfiguracaoAlertaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova configuração de alerta' })
  create(@Body() createConfiguracaoAlertaDto: CreateConfiguracaoAlertaDto, @Request() req) {
    // Se não tiver prefeituraId no body, usar do usuário logado
    if (!createConfiguracaoAlertaDto.prefeituraId && req.user.prefeituraId) {
      createConfiguracaoAlertaDto.prefeituraId = req.user.prefeituraId;
    }
    return this.configuracaoAlertaService.create(createConfiguracaoAlertaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar configurações de alerta' })
  findAll(@Query('prefeituraId') prefeituraId?: number, @Query('ativo') ativo?: boolean, @Request() req?) {
    // Se não tiver prefeituraId na query, usar do usuário logado
    if (!prefeituraId && req?.user?.prefeituraId) {
      prefeituraId = req.user.prefeituraId;
    }
    return this.configuracaoAlertaService.findAll(prefeituraId, ativo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma configuração de alerta por ID' })
  findOne(@Param('id') id: string) {
    return this.configuracaoAlertaService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma configuração de alerta' })
  update(@Param('id') id: string, @Body() updateConfiguracaoAlertaDto: UpdateConfiguracaoAlertaDto) {
    return this.configuracaoAlertaService.update(+id, updateConfiguracaoAlertaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma configuração de alerta' })
  remove(@Param('id') id: string) {
    return this.configuracaoAlertaService.remove(+id);
  }
}

