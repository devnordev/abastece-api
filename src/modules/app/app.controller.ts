import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaPrecoCombustivelService } from '../empresa-preco-combustivel/empresa-preco-combustivel.service';
import { GetPrecoEmpresaCombustivelDto } from '../empresa-preco-combustivel/dto/get-preco-empresa-combustivel.dto';

@ApiTags('App - Solicitações')
@Controller('app/solicitacao')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppController {
  constructor(
    private readonly empresaPrecoCombustivelService: EmpresaPrecoCombustivelService,
  ) {}

  @Get('preco-empresa/combustivel')
  @ApiOperation({ 
    summary: 'Buscar preço atual do combustível por empresa',
    description: 'Retorna o preço atual do combustível para a empresa selecionada. Retorna erro se o combustível não estiver disponível na empresa.'
  })
  @ApiQuery({ name: 'empresaId', required: true, type: Number, description: 'ID da empresa' })
  @ApiQuery({ name: 'combustivelId', required: true, type: Number, description: 'ID do combustível' })
  @ApiResponse({ 
    status: 200, 
    description: 'Preço atual encontrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Preço atual encontrado com sucesso' },
        preco_atual: { type: 'number', example: 5.89 },
        combustivel: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nome: { type: 'string', example: 'Gasolina Comum' },
            sigla: { type: 'string', example: 'G' },
          },
        },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Não temos esse combustível disponível na empresa selecionada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Não temos esse combustível disponível na empresa selecionada' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getPrecoEmpresaCombustivel(@Query() query: GetPrecoEmpresaCombustivelDto) {
    return this.empresaPrecoCombustivelService.findPrecoAtualByEmpresaAndCombustivel(
      query.empresaId,
      query.combustivelId,
    );
  }
}

