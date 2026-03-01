import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperadminExportService } from './superadmin-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('Superadmin Export')
@ApiBearerAuth()
@Controller('superadmin/export')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class SuperadminExportController {
  constructor(private readonly exportService: SuperadminExportService) {}

  @Get('models')
  @ApiOperation({ summary: 'Lista modelos disponíveis para exportação' })
  getModels() {
    return this.exportService.getAvailableModels();
  }

  @Get(':model')
  @ApiOperation({
    summary: 'Exporta dados de qualquer modelo em JSON (para conversão em CSV)',
    description:
      'Retorna todos os registros do modelo com todas as colunas. Use prefeituraId para modelos que possuem essa relação.',
  })
  async exportModel(
    @Param('model') model: string,
    @Query('prefeituraId') prefeituraIdStr?: string,
    @Query('dataInicial') dataInicial?: string,
    @Query('dataFinal') dataFinal?: string,
  ) {
    const prefeituraId = prefeituraIdStr ? parseInt(prefeituraIdStr, 10) : undefined;
    return this.exportService.exportModel(
      model,
      prefeituraId,
      dataInicial,
      dataFinal,
    );
  }
}
