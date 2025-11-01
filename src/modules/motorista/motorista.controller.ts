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
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MotoristaService } from './motorista.service';
import { CreateMotoristaDto } from './dto/create-motorista.dto';
import { UpdateMotoristaDto } from './dto/update-motorista.dto';
import { FindMotoristaDto } from './dto/find-motorista.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';

@ApiTags('Motoristas')
@Controller('motoristas')
@UseGuards(JwtAuthGuard, new RoleBlockGuard(['SUPER_ADMIN']))
@ApiBearerAuth()
export class MotoristaController {
  constructor(private readonly motoristaService: MotoristaService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo motorista' })
  @ApiResponse({ status: 201, description: 'Motorista criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Motorista já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar motorista' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prefeituraId: { type: 'number' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
        email: { type: 'string' },
        cnh: { type: 'string' },
        categoria_cnh: { type: 'string' },
        data_vencimento_cnh: { type: 'string', format: 'date-time' },
        telefone: { type: 'string' },
        endereco: { type: 'string' },
        ativo: { type: 'boolean' },
        observacoes: { type: 'string' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
      required: ['prefeituraId', 'nome', 'cpf', 'email'],
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
    @Body() createMotoristaDto: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: CreateMotoristaDto = {
      ...createMotoristaDto,
      prefeituraId: createMotoristaDto.prefeituraId ? parseInt(createMotoristaDto.prefeituraId) : undefined,
      ativo:
        createMotoristaDto.ativo === 'true' || createMotoristaDto.ativo === true || createMotoristaDto.ativo === undefined
          ? true
          : false,
      data_vencimento_cnh: createMotoristaDto.data_vencimento_cnh
        ? new Date(createMotoristaDto.data_vencimento_cnh)
        : undefined,
    };

    return this.motoristaService.create(processedDto, req.user?.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar motoristas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de motoristas retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'cpf', required: false, description: 'Filtrar por CPF' })
  @ApiQuery({ name: 'cnh', required: false, description: 'Filtrar por CNH' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findMotoristaDto: FindMotoristaDto, @Request() req) {
    return this.motoristaService.findAll(findMotoristaDto, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar motorista por ID' })
  @ApiResponse({ status: 200, description: 'Motorista encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.motoristaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar motorista' })
  @ApiResponse({ status: 200, description: 'Motorista atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 409, description: 'CPF já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prefeituraId: { type: 'number' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
        email: { type: 'string' },
        cnh: { type: 'string' },
        categoria_cnh: { type: 'string' },
        data_vencimento_cnh: { type: 'string', format: 'date-time' },
        telefone: { type: 'string' },
        endereco: { type: 'string' },
        ativo: { type: 'boolean' },
        observacoes: { type: 'string' },
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
    @Body() updateMotoristaDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdateMotoristaDto = {
      ...updateMotoristaDto,
      prefeituraId: updateMotoristaDto.prefeituraId ? parseInt(updateMotoristaDto.prefeituraId) : undefined,
      ativo:
        updateMotoristaDto.ativo !== undefined
          ? updateMotoristaDto.ativo === 'true' || updateMotoristaDto.ativo === true
          : undefined,
      data_vencimento_cnh: updateMotoristaDto.data_vencimento_cnh
        ? new Date(updateMotoristaDto.data_vencimento_cnh)
        : undefined,
    };

    return this.motoristaService.update(id, processedDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir motorista' })
  @ApiResponse({ status: 200, description: 'Motorista excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Motorista não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir motorista com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.motoristaService.remove(id);
  }
}
