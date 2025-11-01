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
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { FindUsuarioDto } from './dto/find-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoUsuario, StatusAcesso } from '@prisma/client';

@ApiTags('Usuários')
@Controller('usuarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar este tipo de usuário' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        senha: { type: 'string' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
        tipo_usuario: { type: 'string', enum: Object.values(TipoUsuario) },
        prefeituraId: { type: 'number' },
        empresaId: { type: 'number' },
        phone: { type: 'string' },
        statusAcess: { type: 'string', enum: Object.values(StatusAcesso) },
        ativo: { type: 'boolean' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
      required: ['email', 'senha', 'nome', 'cpf', 'tipo_usuario'],
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
    @Body() createUsuarioDto: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: CreateUsuarioDto = {
      ...createUsuarioDto,
      prefeituraId: createUsuarioDto.prefeituraId ? parseInt(createUsuarioDto.prefeituraId) : undefined,
      empresaId: createUsuarioDto.empresaId ? parseInt(createUsuarioDto.empresaId) : undefined,
      ativo:
        createUsuarioDto.ativo === 'true' || createUsuarioDto.ativo === true || createUsuarioDto.ativo === undefined
          ? true
          : false,
    };

    return this.usuarioService.create(processedDto, req.user?.id, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'email', required: false, description: 'Filtrar por email' })
  @ApiQuery({ name: 'cpf', required: false, description: 'Filtrar por CPF' })
  @ApiQuery({ name: 'tipo_usuario', required: false, description: 'Filtrar por tipo de usuário' })
  @ApiQuery({ name: 'statusAcess', required: false, description: 'Filtrar por status de acesso' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por empresa' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findUsuarioDto: FindUsuarioDto, @Request() req) {
    return this.usuarioService.findAll(findUsuarioDto, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou CPF já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        senha: { type: 'string' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
        tipo_usuario: { type: 'string', enum: Object.values(TipoUsuario) },
        prefeituraId: { type: 'number' },
        empresaId: { type: 'number' },
        phone: { type: 'string' },
        statusAcess: { type: 'string', enum: Object.values(StatusAcesso) },
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
    @Body() updateUsuarioDto: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdateUsuarioDto = {
      ...updateUsuarioDto,
      prefeituraId: updateUsuarioDto.prefeituraId ? parseInt(updateUsuarioDto.prefeituraId) : undefined,
      empresaId: updateUsuarioDto.empresaId ? parseInt(updateUsuarioDto.empresaId) : undefined,
      ativo:
        updateUsuarioDto.ativo !== undefined
          ? updateUsuarioDto.ativo === 'true' || updateUsuarioDto.ativo === true
          : undefined,
    };

    return this.usuarioService.update(id, processedDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir usuário' })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir usuário com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
