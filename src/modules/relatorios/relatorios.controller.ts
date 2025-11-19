import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RelatoriosService } from './relatorios.service';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';
import { ColaboradorPrefeituraGuard } from '../auth/guards/colaborador-prefeitura.guard';
import { AdminEmpresaGuard } from '../auth/guards/admin-empresa.guard';
import { ColaboradorEmpresaGuard } from '../auth/guards/colaborador-empresa.guard';

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @UseGuards(AdminPrefeituraGuard)
  @Get('admin-prefeitura')
  @ApiOperation({ summary: 'Relatório estratégico para Administradores de Prefeitura' })
  async getAdminPrefeituraRelatorio(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getAdminPrefeituraRelatorio(req.user, filter);
  }

  @UseGuards(ColaboradorPrefeituraGuard)
  @Get('colaborador-prefeitura')
  @ApiOperation({ summary: 'Relatório estratégico para Colaboradores de Prefeitura' })
  async getColaboradorPrefeituraRelatorio(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getColaboradorPrefeituraRelatorio(req.user, filter);
  }

  @UseGuards(AdminEmpresaGuard)
  @Get('admin-empresa')
  @ApiOperation({ summary: 'Relatório estratégico para Administradores de Empresa' })
  async getAdminEmpresaRelatorio(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getAdminEmpresaRelatorio(req.user, filter);
  }

  @UseGuards(ColaboradorEmpresaGuard)
  @Get('colaborador-empresa')
  @ApiOperation({ summary: 'Relatório estratégico para Colaboradores de Empresa' })
  async getColaboradorEmpresaRelatorio(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getColaboradorEmpresaRelatorio(req.user, filter);
  }

  @UseGuards(AdminPrefeituraGuard)
  @Get('painel-faturamento/admin-prefeitura')
  @ApiOperation({ summary: 'Painel de faturamento para Administradores de Prefeitura' })
  async getPainelFaturamentoAdminPrefeitura(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getPainelFaturamentoAdminPrefeitura(req.user, filter);
  }

  @UseGuards(ColaboradorPrefeituraGuard)
  @Get('painel-faturamento/colaborador-prefeitura')
  @ApiOperation({ summary: 'Painel de faturamento para Colaboradores de Prefeitura' })
  async getPainelFaturamentoColaboradorPrefeitura(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getPainelFaturamentoColaboradorPrefeitura(req.user, filter);
  }

  @UseGuards(AdminEmpresaGuard)
  @Get('painel-faturamento/admin-empresa')
  @ApiOperation({ summary: 'Painel de faturamento para Administradores de Empresa' })
  async getPainelFaturamentoAdminEmpresa(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getPainelFaturamentoAdminEmpresa(req.user, filter);
  }

  @UseGuards(ColaboradorEmpresaGuard)
  @Get('painel-faturamento/colaborador-empresa')
  @ApiOperation({ summary: 'Painel de faturamento para Colaboradores de Empresa' })
  async getPainelFaturamentoColaboradorEmpresa(
    @Request() req,
    @Query() filter: FilterRelatorioDto,
  ) {
    return this.relatoriosService.getPainelFaturamentoColaboradorEmpresa(req.user, filter);
  }
}

