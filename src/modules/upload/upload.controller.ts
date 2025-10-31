import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadImageDto } from './dto/upload-image.dto';
import { memoryStorage } from 'multer';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload de imagem para Supabase Storage' })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou erro no upload' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          example: 'empresas',
          description: 'Pasta dentro do bucket',
        },
        fileName: {
          type: 'string',
          example: 'empresa-1',
          description: 'Nome do arquivo (opcional)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const { folder, fileName } = uploadDto;
    const imageUrl = await this.uploadService.uploadImage(file, folder, fileName);

    return {
      message: 'Imagem enviada com sucesso',
      url: imageUrl,
    };
  }
}

