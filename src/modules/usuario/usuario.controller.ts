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
import { CreateColaboradorEmpresaDto } from './dto/create-colaborador-empresa.dto';
import { FindColaboradorEmpresaDto } from './dto/find-colaborador-empresa.dto';
import { UpdateColaboradorEmpresaDto } from './dto/update-colaborador-empresa.dto';
import { ResetSenhaColaboradorEmpresaDto } from './dto/reset-senha-colaborador-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoUsuario, StatusAcesso } from '@prisma/client';
import { AdminEmpresaGuard } from '../auth/guards/admin-empresa.guard';

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
        orgaoIds: { 
          type: 'array', 
          items: { type: 'number' },
          description: 'IDs dos órgãos (apenas para COLABORADOR_PREFEITURA). Permite múltiplos órgãos.',
          example: [1, 2, 3]
        },
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
    // Processar orgaoIds - pode vir como string JSON, array ou string separada por vírgula
    let orgaoIds: number[] | undefined = undefined;
    if (createUsuarioDto.orgaoIds !== undefined && createUsuarioDto.orgaoIds !== null) {
      if (Array.isArray(createUsuarioDto.orgaoIds)) {
        // Array vazio [] = sem órgãos
        // Array com valores = vincular órgãos
        orgaoIds = createUsuarioDto.orgaoIds.length > 0
          ? createUsuarioDto.orgaoIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
          : undefined;
      } else if (typeof createUsuarioDto.orgaoIds === 'string') {
        if (createUsuarioDto.orgaoIds === '') {
          // String vazia = sem órgãos
          orgaoIds = undefined;
        } else {
          try {
            // Tentar parsear como JSON primeiro
            const parsed = JSON.parse(createUsuarioDto.orgaoIds);
            if (Array.isArray(parsed)) {
              orgaoIds = parsed.length > 0
                ? parsed.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id))
                : undefined;
            } else {
              // Se não for array, pode ser número único
              const num = parseInt(parsed);
              orgaoIds = !isNaN(num) ? [num] : undefined;
            }
          } catch {
            // Se não for JSON, pode ser string separada por vírgula
            const ids = createUsuarioDto.orgaoIds
              .split(',')
              .map((id: string) => parseInt(id.trim()))
              .filter((id: number) => !isNaN(id));
            orgaoIds = ids.length > 0 ? ids : undefined;
          }
        }
      }
    }

    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: CreateUsuarioDto = {
      ...createUsuarioDto,
      prefeituraId: createUsuarioDto.prefeituraId ? parseInt(createUsuarioDto.prefeituraId) : undefined,
      empresaId: createUsuarioDto.empresaId ? parseInt(createUsuarioDto.empresaId) : undefined,
      orgaoIds: orgaoIds,
      ativo:
        createUsuarioDto.ativo === 'true' || createUsuarioDto.ativo === true || createUsuarioDto.ativo === undefined
          ? true
          : false,
    };

    return this.usuarioService.create(processedDto, req.user?.id, file);
  }

  @Get('empresa/colaboradores')
  @UseGuards(JwtAuthGuard, AdminEmpresaGuard)
  @ApiOperation({ summary: 'ADMIN_EMPRESA - Listar colaboradores da empresa' })
  @ApiResponse({ status: 200, description: 'Lista de colaboradores retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para visualizar colaboradores' })
  @ApiQuery({ name: 'search', required: false, description: 'Filtrar por nome, email ou CPF' })
  @ApiQuery({ name: 'statusAcess', required: false, description: 'Filtrar por status de acesso' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findColaboradoresEmpresa(@Query() query: any, @Request() req) {
    const processedQuery: FindColaboradorEmpresaDto = {
      ...query,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      ativo:
        query.ativo !== undefined
          ? query.ativo === 'true' || query.ativo === true
          : undefined,
    };
    return this.usuarioService.findColaboradoresEmpresa(processedQuery, req.user);
  }

  @Post('empresa/colaboradores')
  @UseGuards(JwtAuthGuard, AdminEmpresaGuard)
  @ApiOperation({ summary: 'ADMIN_EMPRESA - Criar colaborador da própria empresa' })
  @ApiResponse({ status: 201, description: 'Colaborador criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar colaboradores' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        senha: { type: 'string' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
        phone: { type: 'string' },
        ativo: { type: 'boolean' },
        imagem_perfil: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG, WEBP)',
        },
      },
      required: ['email', 'senha', 'nome', 'cpf'],
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
  async createColaboradorEmpresa(
    @Body() createColaboradorEmpresaDto: CreateColaboradorEmpresaDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usuarioService.createColaboradorEmpresa(createColaboradorEmpresaDto, req.user, file);
  }

  @Patch('empresa/colaboradores/:id')
  @UseGuards(JwtAuthGuard, AdminEmpresaGuard)
  @ApiOperation({ summary: 'ADMIN_EMPRESA - Atualizar colaborador da própria empresa' })
  @ApiResponse({ status: 200, description: 'Colaborador atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para atualizar colaboradores' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        senha: { type: 'string' },
        nome: { type: 'string' },
        cpf: { type: 'string' },
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
  async updateColaboradorEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateColaboradorDto: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const processedDto: UpdateColaboradorEmpresaDto = {
      ...updateColaboradorDto,
      ativo:
        updateColaboradorDto.ativo !== undefined
          ? updateColaboradorDto.ativo === 'true' || updateColaboradorDto.ativo === true
          : undefined,
    };
    return this.usuarioService.updateColaboradorEmpresa(id, processedDto, req.user, file);
  }

  @Delete('empresa/colaboradores/:id')
  @UseGuards(JwtAuthGuard, AdminEmpresaGuard)
  @ApiOperation({ summary: 'ADMIN_EMPRESA - Excluir colaborador da própria empresa' })
  @ApiResponse({ status: 200, description: 'Colaborador excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir colaboradores' })
  async removeColaboradorEmpresa(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usuarioService.removeColaboradorEmpresa(id, req.user);
  }

  @Patch('empresa/colaboradores/:id/reset-senha')
  @UseGuards(JwtAuthGuard, AdminEmpresaGuard)
  @ApiOperation({ summary: 'ADMIN_EMPRESA - Redefinir senha de colaborador' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 404, description: 'Colaborador não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para redefinir senhas' })
  async resetSenhaColaboradorEmpresa(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetDto: ResetSenhaColaboradorEmpresaDto,
    @Request() req,
  ) {
    return this.usuarioService.resetSenhaColaboradorEmpresa(id, resetDto, req.user);
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
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.usuarioService.findOne(id, req.user?.id);
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
        orgaoIds: { 
          type: 'array', 
          items: { type: 'number' },
          description: 'IDs dos órgãos (apenas para COLABORADOR_PREFEITURA). Permite múltiplos órgãos. Enviar array vazio para remover todos.',
          example: [1, 2, 3]
        },
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
    // Processar orgaoIds - pode vir como string JSON, array ou string separada por vírgula
    let orgaoIds: number[] | undefined = undefined;
    if (updateUsuarioDto.orgaoIds !== undefined && updateUsuarioDto.orgaoIds !== null) {
      if (Array.isArray(updateUsuarioDto.orgaoIds)) {
        // Array vazio [] = remover todos os órgãos
        // Array com valores = atualizar órgãos
        orgaoIds = updateUsuarioDto.orgaoIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
      } else if (typeof updateUsuarioDto.orgaoIds === 'string') {
        if (updateUsuarioDto.orgaoIds === '') {
          // String vazia = remover todos os órgãos
          orgaoIds = [];
        } else {
          try {
            // Tentar parsear como JSON primeiro
            const parsed = JSON.parse(updateUsuarioDto.orgaoIds);
            if (Array.isArray(parsed)) {
              orgaoIds = parsed.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));
            } else {
              // Se não for array, pode ser número único
              const num = parseInt(parsed);
              orgaoIds = !isNaN(num) ? [num] : [];
            }
          } catch {
            // Se não for JSON, pode ser string separada por vírgula
            orgaoIds = updateUsuarioDto.orgaoIds
              .split(',')
              .map((id: string) => parseInt(id.trim()))
              .filter((id: number) => !isNaN(id));
          }
        }
      }
    }

    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdateUsuarioDto = {
      ...updateUsuarioDto,
      prefeituraId: updateUsuarioDto.prefeituraId ? parseInt(updateUsuarioDto.prefeituraId) : undefined,
      empresaId: updateUsuarioDto.empresaId ? parseInt(updateUsuarioDto.empresaId) : undefined,
      orgaoIds: orgaoIds !== undefined ? orgaoIds : undefined,
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
