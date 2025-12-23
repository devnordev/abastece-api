import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { TamanhoArquivoPdfExcedidoException, PdfInvalidoException } from '../../common/exceptions';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AtualizaCotaVeiculoService } from './atualiza-cota-veiculo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@ApiTags('Atualiza Cota Veículo')
@Controller('atualiza-cota-veiculo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AtualizaCotaVeiculoController {
  constructor(
    private readonly atualizaCotaVeiculoService: AtualizaCotaVeiculoService,
  ) {}

  @Post('upload-pdf')
  @ApiOperation({
    summary: 'Upload de PDF para atualização de cotas de veículos',
    description:
      'Recebe um arquivo PDF com dados de veículos e atualiza as cotas na tabela veiculo_cota_periodo',
  })
  @ApiResponse({
    status: 201,
    description: 'Cotas atualizadas com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou erro na importação' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF com dados de veículos (formato: veiculos_22_12_25-07_38_24.pdf)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
          cb(null, true);
        } else {
          cb(new PdfInvalidoException('Apenas arquivos PDF são permitidos'), false);
        }
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new PdfInvalidoException('Nenhum arquivo PDF foi enviado');
    }

    // Validar tamanho do arquivo (10MB)
    const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
    if (file.size > tamanhoMaximo) {
      throw new TamanhoArquivoPdfExcedidoException(tamanhoMaximo, file.size);
    }

    return this.atualizaCotaVeiculoService.processarPdf(file);
  }
}

