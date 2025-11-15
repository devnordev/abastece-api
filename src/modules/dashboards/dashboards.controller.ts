import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { AdminPrefeituraDashboardQueryDto } from './dto/admin-prefeitura-dashboard-query.dto';
import { AdminEmpresaDashboardQueryDto } from './dto/admin-empresa-dashboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';
import { AdminEmpresaGuard } from '../auth/guards/admin-empresa.guard';
import { ColaboradorEmpresaGuard } from '../auth/guards/colaborador-empresa.guard';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @UseGuards(AdminPrefeituraGuard)
  @Get('admin-prefeitura')
  @ApiOperation({ summary: 'Dashboard para Administradores de Prefeitura' })
  async getAdminPrefeituraDashboard(
    @Request() req,
    @Query() query: AdminPrefeituraDashboardQueryDto,
  ) {
    return this.dashboardsService.getAdminPrefeituraDashboard(req.user, query);
  }

  @UseGuards(AdminEmpresaGuard)
  @Get('admin-empresa')
  @ApiOperation({ summary: 'Dashboard para Administradores de Empresa' })
  async getAdminEmpresaDashboard(
    @Request() req,
    @Query() query: AdminEmpresaDashboardQueryDto,
  ) {
    return this.dashboardsService.getAdminEmpresaDashboard(req.user, query);
  }

  @UseGuards(ColaboradorEmpresaGuard)
  @Get('colaborador-empresa')
  @ApiOperation({ summary: 'Dashboard para Colaboradores de Empresa' })
  async getColaboradorEmpresaDashboard(
    @Request() req,
    @Query() query: AdminEmpresaDashboardQueryDto,
  ) {
    return this.dashboardsService.getAdminEmpresaDashboard(req.user, query);
  }
}

