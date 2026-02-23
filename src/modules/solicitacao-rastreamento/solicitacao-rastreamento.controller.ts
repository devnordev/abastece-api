import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SolicitacaoRastreamentoService } from './solicitacao-rastreamento.service';
import { CreateSolicitacaoRastreamentoDto } from './dto/create-solicitacao-rastreamento.dto';
import { UpdateStatusSolicitacaoRastreamentoDto } from './dto/update-status-solicitacao-rastreamento.dto';
import { FindSolicitacaoRastreamentoDto } from './dto/find-solicitacao-rastreamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraEmpresaColaboradorGuard } from '../auth/guards/admin-prefeitura-empresa-colaborador.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('Solicitações de Rastreamento')
@Controller('solicitacoes-rastreamento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SolicitacaoRastreamentoController {
  constructor(private readonly solicitacaoService: SolicitacaoRastreamentoService) {}

  @Post()
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Criar solicitação de rastreamento' })
  @ApiResponse({ status: 201, description: 'Solicitação criada com sucesso' })
  async create(
    @Body() createDto: CreateSolicitacaoRastreamentoDto,
    @Req() req: Request & { user: any },
  ) {
    return this.solicitacaoService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitações de rastreamento' })
  @ApiResponse({ status: 200, description: 'Lista de solicitações' })
  async findAll(
    @Query() query: FindSolicitacaoRastreamentoDto,
    @Req() req: Request & { user: any },
  ) {
    const isSuperAdmin = req.user?.tipo_usuario === 'SUPER_ADMIN';
    return this.solicitacaoService.findAll(query, req.user?.id, isSuperAdmin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter solicitação de rastreamento por ID' })
  @ApiResponse({ status: 200, description: 'Solicitação encontrada' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: any },
  ) {
    const isSuperAdmin = req.user?.tipo_usuario === 'SUPER_ADMIN';
    return this.solicitacaoService.findOne(id, req.user?.id, isSuperAdmin);
  }

  @Patch(':id/status')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Aprovar ou rejeitar solicitação de rastreamento' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateStatusSolicitacaoRastreamentoDto,
    @Req() req: Request & { user: any },
  ) {
    const isSuperAdmin = req.user?.tipo_usuario === 'SUPER_ADMIN';
    return this.solicitacaoService.updateStatus(id, updateDto, req.user.id, isSuperAdmin);
  }
}
