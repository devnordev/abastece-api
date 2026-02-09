import { Controller, Get, Post, Param, UseGuards, Request, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertaService } from './alerta.service';
import { FindAlertaDto } from './dto/find-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminPrefeituraGuard } from '../auth/guards/super-admin-prefeitura.guard';

@ApiTags('Alertas')
@ApiBearerAuth()
@Controller('alertas')
@UseGuards(JwtAuthGuard, SuperAdminPrefeituraGuard)
export class AlertaController {
  constructor(private readonly alertaService: AlertaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alertas da prefeitura' })
  findAll(@Request() req, @Query() findAlertaDto: FindAlertaDto) {
    const prefeituraId = req.user.prefeituraId;
    if (!prefeituraId) {
      throw new Error('Usuário não possui prefeitura associada');
    }
    return this.alertaService.findAll(prefeituraId, findAlertaDto);
  }

  @Post('gerar')
  @ApiOperation({ summary: 'Gerar alertas baseados nas regras configuradas' })
  gerarAlertas(@Request() req) {
    const prefeituraId = req.user.prefeituraId;
    if (!prefeituraId) {
      throw new Error('Usuário não possui prefeitura associada');
    }
    return this.alertaService.gerarAlertas(prefeituraId);
  }

  @Patch(':id/resolver')
  @ApiOperation({ summary: 'Marcar alerta como resolvido' })
  marcarComoResolvido(@Param('id') id: string, @Request() req) {
    return this.alertaService.marcarComoResolvido(+id, req.user.id);
  }
}

