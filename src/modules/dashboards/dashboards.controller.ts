import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { AdminPrefeituraDashboardQueryDto } from './dto/admin-prefeitura-dashboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraGuard } from '../auth/guards/admin-prefeitura.guard';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard, AdminPrefeituraGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('admin-prefeitura')
  @ApiOperation({ summary: 'Dashboard para Administradores de Prefeitura' })
  async getAdminPrefeituraDashboard(
    @Request() req,
    @Query() query: AdminPrefeituraDashboardQueryDto,
  ) {
    return this.dashboardsService.getAdminPrefeituraDashboard(req.user, query);
  }
}

