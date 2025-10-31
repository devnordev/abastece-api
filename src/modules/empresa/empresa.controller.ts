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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { FindEmpresaDto } from './dto/find-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';

@ApiTags('Empresas')
@Controller('empresas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmpresaController {
  constructor(
    private readonly empresaService: EmpresaService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Empresa já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        uf: { type: 'string', enum: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] },
        endereco: { type: 'string' },
        contato: { type: 'string' },
        ativo: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        tipo_empresa: { type: 'string', enum: ['POSTO_GASOLINA', 'DISTRIBUIDORA', 'OUTROS'] },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        endereco_completo: { type: 'string' },
        horario_funcionamento: { type: 'string' },
        telefone: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        bandeira: { type: 'string' },
        servicos_disponiveis: { type: 'string' },
        formas_pagamento: { type: 'string' },
        avaliacao: { type: 'number' },
        total_avaliacoes: { type: 'number' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
      required: ['nome', 'cnpj', 'uf'],
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
    @Body() createEmpresaDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: CreateEmpresaDto = {
      ...createEmpresaDto,
      ativo: createEmpresaDto.ativo === 'true' || createEmpresaDto.ativo === true || createEmpresaDto.ativo === undefined ? true : false,
      isPublic: createEmpresaDto.isPublic === 'true' || createEmpresaDto.isPublic === true ? true : false,
      latitude: createEmpresaDto.latitude ? parseFloat(createEmpresaDto.latitude) : undefined,
      longitude: createEmpresaDto.longitude ? parseFloat(createEmpresaDto.longitude) : undefined,
      avaliacao: createEmpresaDto.avaliacao ? parseFloat(createEmpresaDto.avaliacao) : undefined,
      total_avaliacoes: createEmpresaDto.total_avaliacoes ? parseInt(createEmpresaDto.total_avaliacoes) : undefined,
    };

    return this.empresaService.create(processedDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de empresas retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'cnpj', required: false, description: 'Filtrar por CNPJ' })
  @ApiQuery({ name: 'uf', required: false, description: 'Filtrar por UF' })
  @ApiQuery({ name: 'tipo_empresa', required: false, description: 'Filtrar por tipo de empresa' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filtrar por empresas públicas' })
  @ApiQuery({ name: 'bandeira', required: false, description: 'Filtrar por bandeira' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findEmpresaDto: FindEmpresaDto) {
    return this.empresaService.findAll(findEmpresaDto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Buscar empresas próximas por coordenadas' })
  @ApiResponse({ status: 200, description: 'Empresas próximas encontradas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Raio em km (padrão: 10)' })
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    return this.empresaService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'CNPJ já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nome: { type: 'string' },
        cnpj: { type: 'string' },
        uf: { type: 'string', enum: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] },
        endereco: { type: 'string' },
        contato: { type: 'string' },
        ativo: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        tipo_empresa: { type: 'string', enum: ['POSTO_GASOLINA', 'DISTRIBUIDORA', 'OUTROS'] },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        endereco_completo: { type: 'string' },
        horario_funcionamento: { type: 'string' },
        telefone: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        bandeira: { type: 'string' },
        servicos_disponiveis: { type: 'string' },
        formas_pagamento: { type: 'string' },
        avaliacao: { type: 'number' },
        total_avaliacoes: { type: 'number' },
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
    @Body() updateEmpresaDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdateEmpresaDto = {
      ...updateEmpresaDto,
      ativo: updateEmpresaDto.ativo !== undefined ? (updateEmpresaDto.ativo === 'true' || updateEmpresaDto.ativo === true) : undefined,
      isPublic: updateEmpresaDto.isPublic !== undefined ? (updateEmpresaDto.isPublic === 'true' || updateEmpresaDto.isPublic === true) : undefined,
      latitude: updateEmpresaDto.latitude ? parseFloat(updateEmpresaDto.latitude) : undefined,
      longitude: updateEmpresaDto.longitude ? parseFloat(updateEmpresaDto.longitude) : undefined,
      avaliacao: updateEmpresaDto.avaliacao ? parseFloat(updateEmpresaDto.avaliacao) : undefined,
      total_avaliacoes: updateEmpresaDto.total_avaliacoes ? parseInt(updateEmpresaDto.total_avaliacoes) : undefined,
    };

    return this.empresaService.update(id, processedDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir empresa' })
  @ApiResponse({ status: 200, description: 'Empresa excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir empresa com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.remove(id);
  }

  @Post(':id/upload-imagem-perfil')
  @ApiOperation({ summary: 'Upload de imagem de perfil da empresa' })
  @ApiResponse({ status: 200, description: 'Imagem de perfil atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
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
      },
      required: ['file'],
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
  async uploadImagemPerfil(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    // Verificar se empresa existe
    const empresa = await this.empresaService.findOne(id);
    if (!empresa || !empresa.empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // Se já tiver uma imagem, remover a antiga (opcional)
    const empresaAntiga = empresa.empresa;
    if (empresaAntiga.imagem_perfil) {
      try {
        const oldFilePath = this.uploadService.extractFilePathFromUrl(empresaAntiga.imagem_perfil);
        if (oldFilePath) {
          await this.uploadService.deleteImage(oldFilePath);
        }
      } catch (error) {
        // Não falhar se não conseguir remover a imagem antiga
        console.warn('Erro ao remover imagem antiga:', error);
      }
    }

    // Fazer upload da nova imagem
    const fileName = `empresa-${id}`;
    const imageUrl = await this.uploadService.uploadImage(file, 'empresas', fileName);

    // Atualizar empresa com a nova URL
    const updatedEmpresa = await this.empresaService.update(id, {
      imagem_perfil: imageUrl,
    } as UpdateEmpresaDto);

    return {
      message: 'Imagem de perfil atualizada com sucesso',
      url: imageUrl,
      empresa: updatedEmpresa.empresa,
    };
  }
}
