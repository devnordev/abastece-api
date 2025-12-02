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
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { VeiculoService } from './veiculo.service';
import { CreateVeiculoDto } from './dto/create-veiculo.dto';
import { UpdateVeiculoDto } from './dto/update-veiculo.dto';
import { FindVeiculoDto } from './dto/find-veiculo.dto';
import { CreateSolicitacaoQrCodeDto } from './dto/create-solicitacao-qrcode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleBlockGuard } from '../auth/guards/role-block.guard';
import { EmpresaGuard } from '../auth/guards/empresa.guard';

@ApiTags('Veículos')
@Controller('veiculos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VeiculoController {
  constructor(private readonly veiculoService: VeiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo veículo' })
  @ApiResponse({ status: 201, description: 'Veículo criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Veículo já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cadastrar veículo' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prefeituraId: { type: 'number' },
        orgaoId: { type: 'number' },
        contaFaturamentoOrgaoId: { type: 'number' },
        nome: { type: 'string' },
        placa: { type: 'string' },
        modelo: { type: 'string' },
        ano: { type: 'number' },
        tipo_abastecimento: { type: 'string', enum: ['COTA', 'LIVRE', 'COM_AUTORIZACAO'] },
        ativo: { type: 'boolean' },
        capacidade_tanque: { type: 'number' },
        tipo_veiculo: { type: 'string' },
        situacao_veiculo: { type: 'string' },
        observacoes: { type: 'string' },
        periodicidade: { type: 'string' },
        quantidade: { type: 'number' },
        apelido: { type: 'string' },
        ano_fabricacao: { type: 'number' },
        chassi: { type: 'string' },
        renavam: { type: 'string' },
        crlv: { type: 'string' },
        crlv_vencimento: { type: 'string', format: 'date-time' },
        tacografo: { type: 'string' },
        cor: { type: 'string' },
        capacidade_passageiros: { type: 'number' },
        categoriaIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        combustivelIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        motoristaIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        foto_veiculo: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem do veículo (JPEG, PNG, WEBP)',
        },
        foto_crlv: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem do CRLV (JPEG, PNG, WEBP)',
        },
      },
      required: ['prefeituraId', 'orgaoId', 'nome', 'placa', 'tipo_abastecimento', 'capacidade_tanque', 'combustivelIds'],
    },
  })
  @UseInterceptors(
    FileInterceptor('foto_veiculo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createVeiculoDto: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      // Converter strings para tipos corretos quando vêm de multipart/form-data
      const processedDto: CreateVeiculoDto = {
        ...createVeiculoDto,
        prefeituraId: createVeiculoDto.prefeituraId ? parseInt(createVeiculoDto.prefeituraId) : undefined,
        orgaoId: createVeiculoDto.orgaoId ? parseInt(createVeiculoDto.orgaoId) : undefined,
        contaFaturamentoOrgaoId: createVeiculoDto.contaFaturamentoOrgaoId
          ? parseInt(createVeiculoDto.contaFaturamentoOrgaoId)
          : undefined,
        ano: createVeiculoDto.ano ? parseInt(createVeiculoDto.ano) : undefined,
        ano_fabricacao: createVeiculoDto.ano_fabricacao ? parseInt(createVeiculoDto.ano_fabricacao) : undefined,
        capacidade_passageiros: createVeiculoDto.capacidade_passageiros
          ? parseInt(createVeiculoDto.capacidade_passageiros)
          : undefined,
        capacidade_tanque: createVeiculoDto.capacidade_tanque
          ? parseFloat(createVeiculoDto.capacidade_tanque)
          : undefined,
        quantidade: createVeiculoDto.quantidade ? parseFloat(createVeiculoDto.quantidade) : undefined,
        ativo:
          createVeiculoDto.ativo === 'true' || createVeiculoDto.ativo === true || createVeiculoDto.ativo === undefined
            ? true
            : false,
        crlv_vencimento: createVeiculoDto.crlv_vencimento ? new Date(createVeiculoDto.crlv_vencimento) : undefined,
        categoriaIds: createVeiculoDto.categoriaIds
          ? Array.isArray(createVeiculoDto.categoriaIds)
            ? createVeiculoDto.categoriaIds.map((id: any) => parseInt(id))
            : typeof createVeiculoDto.categoriaIds === 'string'
              ? createVeiculoDto.categoriaIds.split(',').map((id: string) => parseInt(id.trim()))
              : undefined
          : undefined,
        combustivelIds: createVeiculoDto.combustivelIds
          ? Array.isArray(createVeiculoDto.combustivelIds)
            ? createVeiculoDto.combustivelIds.map((id: any) => parseInt(id))
            : typeof createVeiculoDto.combustivelIds === 'string'
              ? createVeiculoDto.combustivelIds.split(',').map((id: string) => parseInt(id.trim()))
              : undefined
          : undefined,
        motoristaIds: createVeiculoDto.motoristaIds
          ? Array.isArray(createVeiculoDto.motoristaIds)
            ? createVeiculoDto.motoristaIds.map((id: any) => parseInt(id))
            : typeof createVeiculoDto.motoristaIds === 'string'
              ? createVeiculoDto.motoristaIds.split(',').map((id: string) => parseInt(id.trim()))
              : undefined
          : undefined,
      };

      return await this.veiculoService.create(processedDto, req.user?.id, file);
    } catch (error) {
      // Re-lançar exceções conhecidas do NestJS
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      // Log e relançar como BadRequestException para erros desconhecidos
      console.error('Erro ao criar veículo:', error);
      throw new BadRequestException(
        `Erro ao criar veículo: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar veículos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'nome', required: false, description: 'Filtrar por nome' })
  @ApiQuery({ name: 'placa', required: false, description: 'Filtrar por placa' })
  @ApiQuery({ name: 'modelo', required: false, description: 'Filtrar por modelo' })
  @ApiQuery({ name: 'tipo_veiculo', required: false, description: 'Filtrar por tipo de veículo' })
  @ApiQuery({ name: 'situacao_veiculo', required: false, description: 'Filtrar por situação do veículo' })
  @ApiQuery({ name: 'tipo_abastecimento', required: false, description: 'Filtrar por tipo de abastecimento' })
  @ApiQuery({ name: 'periodicidade', required: false, description: 'Filtrar por periodicidade' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura' })
  @ApiQuery({ name: 'orgaoId', required: false, description: 'Filtrar por órgão' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findVeiculoDto: FindVeiculoDto, @Request() req) {
    return this.veiculoService.findAll(findVeiculoDto, req.user?.id);
  }

  @Get('buscar/placa')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  @ApiOperation({ summary: 'Buscar veículos por placa (perfis de empresa)' })
  @ApiQuery({ name: 'placa', required: true, description: 'Placa completa ou parcial', example: 'ABC' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Quantidade máxima de resultados (1-100)',
    example: 20,
  })
  @ApiResponse({ status: 200, description: 'Lista de veículos retornada com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem acessar' })
  async findByPlacaForEmpresa(@Query('placa') placa: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const limitValue = parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined;
    return this.veiculoService.findByPlacaForEmpresa(placa, limitValue);
  }

  @Get('qrcode/:codigo')
  @UseGuards(JwtAuthGuard, EmpresaGuard)
  @ApiOperation({ summary: 'Buscar veículo por código QR code' })
  @ApiParam({ name: 'codigo', description: 'Código QR code do veículo (8 caracteres)', example: 'ABC12345' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado ou QR code inválido' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem acessar' })
  async findByQrCode(@Param('codigo') codigo: string) {
    return this.veiculoService.findByQrCode(codigo);
  }

  @Get(':id/motoristas')
  @ApiOperation({ summary: 'Listar motoristas vinculados ao veículo' })
  @ApiResponse({ status: 200, description: 'Lista de motoristas retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findMotoristas(@Param('id', ParseIntPipe) id: number) {
    return this.veiculoService.findMotoristasByVeiculo(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.veiculoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa já está em uso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orgaoId: { type: 'number' },
        contaFaturamentoOrgaoId: { type: 'number' },
        nome: { type: 'string' },
        placa: { type: 'string' },
        modelo: { type: 'string' },
        ano: { type: 'number' },
        tipo_abastecimento: { type: 'string', enum: ['COTA', 'LIVRE', 'COM_AUTORIZACAO'] },
        ativo: { type: 'boolean' },
        capacidade_tanque: { type: 'number' },
        tipo_veiculo: { type: 'string' },
        situacao_veiculo: { type: 'string' },
        observacoes: { type: 'string' },
        periodicidade: { type: 'string' },
        quantidade: { type: 'number' },
        apelido: { type: 'string' },
        ano_fabricacao: { type: 'number' },
        chassi: { type: 'string' },
        renavam: { type: 'string' },
        crlv: { type: 'string' },
        crlv_vencimento: { type: 'string', format: 'date-time' },
        tacografo: { type: 'string' },
        cor: { type: 'string' },
        capacidade_passageiros: { type: 'number' },
        categoriaIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        combustivelIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        motoristaIds: { type: 'string', description: 'Array de IDs separados por vírgula' },
        foto_veiculo: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem do veículo (JPEG, PNG, WEBP)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('foto_veiculo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVeiculoDto: any,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Converter strings para tipos corretos quando vêm de multipart/form-data
    const processedDto: UpdateVeiculoDto = {
      ...updateVeiculoDto,
      orgaoId: updateVeiculoDto.orgaoId ? parseInt(updateVeiculoDto.orgaoId) : undefined,
      contaFaturamentoOrgaoId: updateVeiculoDto.contaFaturamentoOrgaoId
        ? parseInt(updateVeiculoDto.contaFaturamentoOrgaoId)
        : undefined,
      ano: updateVeiculoDto.ano ? parseInt(updateVeiculoDto.ano) : undefined,
      ano_fabricacao: updateVeiculoDto.ano_fabricacao ? parseInt(updateVeiculoDto.ano_fabricacao) : undefined,
      capacidade_passageiros: updateVeiculoDto.capacidade_passageiros
        ? parseInt(updateVeiculoDto.capacidade_passageiros)
        : undefined,
      capacidade_tanque: updateVeiculoDto.capacidade_tanque
        ? parseFloat(updateVeiculoDto.capacidade_tanque)
        : undefined,
      quantidade: updateVeiculoDto.quantidade ? parseFloat(updateVeiculoDto.quantidade) : undefined,
      ativo:
        updateVeiculoDto.ativo !== undefined
          ? updateVeiculoDto.ativo === 'true' || updateVeiculoDto.ativo === true
          : undefined,
      crlv_vencimento: updateVeiculoDto.crlv_vencimento ? new Date(updateVeiculoDto.crlv_vencimento) : undefined,
      categoriaIds: updateVeiculoDto.categoriaIds
        ? Array.isArray(updateVeiculoDto.categoriaIds)
          ? updateVeiculoDto.categoriaIds.map((id: any) => parseInt(id))
          : typeof updateVeiculoDto.categoriaIds === 'string'
            ? updateVeiculoDto.categoriaIds.split(',').map((id: string) => parseInt(id.trim()))
            : undefined
        : undefined,
      combustivelIds: updateVeiculoDto.combustivelIds
        ? Array.isArray(updateVeiculoDto.combustivelIds)
          ? updateVeiculoDto.combustivelIds.map((id: any) => parseInt(id))
          : typeof updateVeiculoDto.combustivelIds === 'string'
            ? updateVeiculoDto.combustivelIds.split(',').map((id: string) => parseInt(id.trim()))
            : undefined
        : undefined,
      motoristaIds: updateVeiculoDto.motoristaIds !== undefined && updateVeiculoDto.motoristaIds !== null
        ? Array.isArray(updateVeiculoDto.motoristaIds)
          ? updateVeiculoDto.motoristaIds.length > 0
            ? updateVeiculoDto.motoristaIds.map((id: any) => parseInt(id))
            : [] // Array vazio explícito para remover todos os motoristas
          : typeof updateVeiculoDto.motoristaIds === 'string' && updateVeiculoDto.motoristaIds.trim() !== ''
            ? updateVeiculoDto.motoristaIds.split(',').map((id: string) => parseInt(id.trim()))
            : undefined
        : undefined,
    };

    return this.veiculoService.update(id, processedDto, req.user?.id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir veículo' })
  @ApiResponse({ status: 200, description: 'Veículo excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível excluir veículo com relacionamentos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.veiculoService.remove(id);
  }

  @Delete(':id/deletar_em_cascata')
  @ApiOperation({ summary: 'Deletar veículo em cascata e restaurar quantidades de combustíveis' })
  @ApiParam({ name: 'id', description: 'ID do veículo a ser deletado em cascata' })
  @ApiResponse({ status: 200, description: 'Veículo deletado em cascata com sucesso' })
  @ApiResponse({ status: 400, description: 'ID inválido, veículo inativo ou erro na transação' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado ou cotas referenciadas não encontradas' })
  @ApiResponse({ status: 409, description: 'Violação de constraint única' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async delegarVeiculo(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.veiculoService.delegarVeiculo(id);
    } catch (error) {
      // Re-lançar exceções conhecidas do NestJS
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Log e relançar como BadRequestException para erros desconhecidos
      console.error('Erro ao deletar veículo em cascata:', error);
      throw new BadRequestException(
        `Erro ao deletar veículo em cascata: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  @Post('solicitacoes/qrcode')
  @UseGuards(JwtAuthGuard, new RoleBlockGuard(['ADMIN_EMPRESA', 'COLABORADOR_EMPRESA']))
  @ApiOperation({ summary: 'Criar solicitações de QR Code para veículos' })
  @ApiResponse({ status: 201, description: 'Solicitações de QR Code criadas com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar solicitações de QR Code' })
  @ApiResponse({ status: 404, description: 'Um ou mais veículos não foram encontrados' })
  @ApiResponse({ status: 409, description: 'Já existe uma solicitação em andamento para um ou mais veículos' })
  async createSolicitacoesQrCode(
    @Body() createSolicitacaoQrCodeDto: CreateSolicitacaoQrCodeDto,
    @Request() req,
  ) {
    try {
      return await this.veiculoService.createSolicitacoesQrCode(createSolicitacaoQrCodeDto, req.user?.id);
    } catch (error) {
      // Re-lançar exceções conhecidas do NestJS
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      // Log e relançar como BadRequestException para erros desconhecidos
      console.error('Erro ao criar solicitações de QR Code:', error);
      throw new BadRequestException(
        `Erro ao criar solicitações de QR Code: ${error.message || 'Erro desconhecido'}`,
      );
    }
  }
}
