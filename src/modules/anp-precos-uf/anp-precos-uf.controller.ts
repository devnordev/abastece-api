import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AnpPrecosUfService } from './anp-precos-uf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { memoryStorage } from 'multer';

@ApiTags('ANP Preços UF')
@Controller('anp-precos-uf')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class AnpPrecosUfController {
  constructor(private readonly anpPrecosUfService: AnpPrecosUfService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os preços ANP por UF' })
  @ApiResponse({ status: 200, description: 'Lista de preços ANP por UF' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findAll() {
    return this.anpPrecosUfService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar preço ANP por ID' })
  @ApiResponse({ status: 200, description: 'Preço ANP encontrado' })
  @ApiResponse({ status: 404, description: 'Preço ANP não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.anpPrecosUfService.findOne(id);
  }

  @Get('semana/:anpSemanaId')
  @ApiOperation({ summary: 'Buscar preços ANP por semana' })
  @ApiResponse({ status: 200, description: 'Preços ANP encontrados para a semana' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  async findBySemana(@Param('anpSemanaId', ParseIntPipe) anpSemanaId: number) {
    return this.anpPrecosUfService.findBySemana(anpSemanaId);
  }

  @Post('importar-csv')
  @ApiOperation({ summary: 'Importar preços ANP a partir de arquivo CSV' })
  @ApiResponse({ status: 201, description: 'Preços importados com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou erro na importação' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Acesso negado - apenas SUPER_ADMIN' })
  @ApiResponse({ status: 404, description: 'Semana ANP ou parâmetro de teto não encontrado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo CSV com os preços ANP',
        },
        anp_semana_id: {
          type: 'number',
          description: 'ID da semana ANP de referência',
          example: 1,
        },
      },
      required: ['file', 'anp_semana_id'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Apenas arquivos CSV são permitidos'), false);
        }
      },
    }),
  )
  async importarCSV(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo CSV foi enviado');
    }

    const anpSemanaId = parseInt(body.anp_semana_id);
    if (isNaN(anpSemanaId) || anpSemanaId <= 0) {
      throw new BadRequestException('anp_semana_id deve ser um número inteiro positivo');
    }

    // Converter buffer para string
    const csvContent = file.buffer.toString('utf-8');

    return this.anpPrecosUfService.importarPrecosCSV(anpSemanaId, csvContent);
  }
}

