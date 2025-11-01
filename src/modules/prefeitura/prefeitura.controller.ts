import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PrefeituraService } from './prefeitura.service';
import { CreatePrefeituraDto } from './dto/create-prefeitura.dto';
import { UpdatePrefeituraDto } from './dto/update-prefeitura.dto';
import { FindPrefeituraDto } from './dto/find-prefeitura.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Prefeituras')
@Controller('prefeituras')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrefeituraController {
  constructor(private readonly prefeituraService: PrefeituraService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova prefeitura' })
  @ApiResponse({ status: 201, description: 'Prefeitura criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Prefeitura já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        email_administrativo: { type: 'string' },
        requer_cupom_fiscal: { type: 'boolean' },
        ativo: { type: 'boolean' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
      required: ['nome', 'cnpj', 'email_administrativo'],
    },
  })
  @UseInterceptors(
    FileInterceptor('imagem_perfil', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createPrefeituraDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: CreatePrefeituraDto = {
      ...createPrefeituraDto,
      requer_cupom_fiscal:
        createPrefeituraDto.requer_cupom_fiscal !== undefined
          ? createPrefeituraDto.requer_cupom_fiscal === 'true' || createPrefeituraDto.requer_cupom_fiscal === true
          : undefined,
      ativo:
        createPrefeituraDto.ativo === 'true' || createPrefeituraDto.ativo === true || createPrefeituraDto.ativo === undefined
          ? true
          : false,
    };

    return this.prefeituraService.create(processedDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar prefeituras com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de prefeituras retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'cnpj', required: false, description: 'Filtrar por CNPJ' })
  @ApiQuery({ name: 'email_administrativo', required: false, description: 'Filtrar por email administrativo' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findPrefeituraDto: FindPrefeituraDto) {
    return this.prefeituraService.findAll(findPrefeituraDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar prefeitura por ID' })
  @ApiResponse({ status: 200, description: 'Prefeitura encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prefeituraService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar prefeitura' })
  @ApiResponse({ status: 200, description: 'Prefeitura atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 409, description: 'CNPJ ou email já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        email_administrativo: { type: 'string' },
        requer_cupom_fiscal: { type: 'boolean' },
        ativo: { type: 'boolean' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('imagem_perfil', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePrefeituraDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdatePrefeituraDto = {
      ...updatePrefeituraDto,
      requer_cupom_fiscal:
        updatePrefeituraDto.requer_cupom_fiscal !== undefined
          ? updatePrefeituraDto.requer_cupom_fiscal === 'true' || updatePrefeituraDto.requer_cupom_fiscal === true
          : undefined,
      ativo:
        updatePrefeituraDto.ativo !== undefined
          ? updatePrefeituraDto.ativo === 'true' || updatePrefeituraDto.ativo === true
          : undefined,
    };

    return this.prefeituraService.update(id, processedDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir prefeitura' })
  @ApiResponse({ status: 200, description: 'Prefeitura excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Prefeitura não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir prefeitura com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.prefeituraService.remove(id);
  }
}
