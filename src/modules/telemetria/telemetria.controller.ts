import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TelemetriaService } from './telemetria.service';
import { CreateTelemetriaPrefeituraDto } from './dto/create-telemetria-prefeitura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('Telemetria')
@Controller('telemetria')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class TelemetriaController {
  constructor(private readonly telemetriaService: TelemetriaService) {}

  @Post('prefeitura/:prefeituraId')
  @ApiOperation({ summary: 'Salvar configuração de telemetria para uma prefeitura' })
  @ApiParam({ name: 'prefeituraId', description: 'ID da prefeitura', type: Number })
  @ApiResponse({ status: 200, description: 'Configuração salva com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas SUPER_ADMIN)' })
  async savePrefeituraConfig(
    @Param('prefeituraId', ParseIntPipe) prefeituraId: number,
    @Body() createDto: CreateTelemetriaPrefeituraDto,
  ) {
    return this.telemetriaService.savePrefeituraConfig(prefeituraId, createDto);
  }

  @Get('prefeitura/:prefeituraId')
  @ApiOperation({ summary: 'Buscar configuração de telemetria de uma prefeitura' })
  @ApiParam({ name: 'prefeituraId', description: 'ID da prefeitura', type: Number })
  @ApiResponse({ status: 200, description: 'Configuração encontrada' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada ou sem configuração' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas SUPER_ADMIN)' })
  async getPrefeituraConfig(
    @Param('prefeituraId', ParseIntPipe) prefeituraId: number,
  ) {
    const config = await this.telemetriaService.getPrefeituraConfig(prefeituraId);
    
    if (!config) {
      return {
        message: 'Prefeitura não possui configuração de telemetria',
        organizacaoId: null,
        apiKey: null,
        apiKeyId: null,
      };
    }

    return config;
  }
}
