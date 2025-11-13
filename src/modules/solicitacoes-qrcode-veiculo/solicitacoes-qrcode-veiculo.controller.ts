import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { SolicitacoesQrCodeVeiculoService } from './solicitacoes-qrcode-veiculo.service';
import { FilterSolicitacoesDto } from './dto/filter-solicitacoes.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { StatusSolicitacaoQrCodeVeiculo } from '@prisma/client';

@ApiTags('Solicitações QR Code Veículo')
@Controller('solicitacoes-qrcode-veiculo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SolicitacoesQrCodeVeiculoController {
  constructor(private readonly solicitacoesQrCodeVeiculoService: SolicitacoesQrCodeVeiculoService) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Listar solicitações de QR Code agrupadas por prefeitura (apenas SUPER_ADMIN)',
    description: 'Lista todas as solicitações de QR Code agrupadas por prefeitura. Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiResponse({ status: 200, description: 'Solicitações encontradas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async findAllGroupedByPrefeitura(@Query() filterDto: FilterSolicitacoesDto) {
    try {
      return await this.solicitacoesQrCodeVeiculoService.findAllGroupedByPrefeitura(filterDto);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao listar solicitações:', error);
      throw new BadRequestException(
        `Erro ao listar solicitações: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Get(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Buscar solicitação de QR Code por ID (apenas SUPER_ADMIN)',
    description: 'Busca uma solicitação de QR Code específica por ID. Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Solicitação encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.solicitacoesQrCodeVeiculoService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar solicitação:', error);
      throw new BadRequestException(
        `Erro ao buscar solicitação: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/aprovado')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Aprovado',
    description: 'Atualiza o status da solicitação de QR Code para "Aprovado". Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Status atualizado para Aprovado com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToAprovado(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    try {
      const updateDto: UpdateStatusDto = { status: StatusSolicitacaoQrCodeVeiculo.Aprovado };
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/em-producao')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Em Produção',
    description: 'Atualiza o status da solicitação de QR Code para "Em Produção". Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Status atualizado para Em Produção com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToEmProducao(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    try {
      const updateDto: UpdateStatusDto = { status: StatusSolicitacaoQrCodeVeiculo.Em_Producao };
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/integracao')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Integração',
    description: 'Atualiza o status da solicitação de QR Code para "Integração". Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Status atualizado para Integração com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToIntegracao(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    try {
      const updateDto: UpdateStatusDto = { status: StatusSolicitacaoQrCodeVeiculo.Integracao };
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/concluida')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Concluída',
    description: 'Atualiza o status da solicitação de QR Code para "Concluída". Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Status atualizado para Concluída com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToConcluida(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    try {
      const updateDto: UpdateStatusDto = { status: StatusSolicitacaoQrCodeVeiculo.Concluida };
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/cancelado')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Cancelado',
    description: 'Atualiza o status da solicitação de QR Code para "Cancelado". É obrigatório informar o motivo do cancelamento. Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiBody({
    type: UpdateStatusDto,
    description: 'Dados para cancelar a solicitação',
    examples: {
      exemplo: {
        value: {
          status: 'Cancelado',
          motivoCancelamento: 'Solicitação cancelada pelo usuário',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status atualizado para Cancelado com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida ou motivo do cancelamento não informado' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToCancelado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ) {
    try {
      if (updateStatusDto.status !== StatusSolicitacaoQrCodeVeiculo.Cancelado) {
        throw new BadRequestException('Esta rota é apenas para cancelar solicitações. Use status: Cancelado');
      }
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateStatusDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Patch(':id/status/inativo')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Atualizar status da solicitação para Inativo',
    description: 'Atualiza o status da solicitação de QR Code para "Inativo" (momentâneo). Apenas usuários com perfil SUPER_ADMIN podem acessar.',
  })
  @ApiParam({ name: 'id', description: 'ID da solicitação', example: 1 })
  @ApiResponse({ status: 200, description: 'Status atualizado para Inativo com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas SUPER_ADMIN pode acessar esta rota' })
  async updateStatusToInativo(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    try {
      const updateDto: UpdateStatusDto = { status: StatusSolicitacaoQrCodeVeiculo.Inativo };
      return await this.solicitacoesQrCodeVeiculoService.updateStatus(id, updateDto, req.user?.id);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar status:', error);
      throw new BadRequestException(
        `Erro ao atualizar status: ${error.message || 'Erro desconhecido'}`
      );
    }
  }
}

