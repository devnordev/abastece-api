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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody, ApiExtraModels } from '@nestjs/swagger';
import { AbastecimentoService } from './abastecimento.service';
import { CreateAbastecimentoDto } from './dto/create-abastecimento.dto';
import { UpdateAbastecimentoDto } from './dto/update-abastecimento.dto';
import { FindAbastecimentoDto } from './dto/find-abastecimento.dto';
import { CreateAbastecimentoFromSolicitacaoDto } from './dto/create-abastecimento-from-solicitacao.dto';
import { CreateAbastecimentoFromQrCodeVeiculoDto } from './dto/create-abastecimento-from-qrcode-veiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpresaGuard } from '../auth/guards/empresa.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { getSchemaPath } from '@nestjs/swagger';

@ApiExtraModels(CreateAbastecimentoDto)
@ApiTags('Abastecimentos')
@Controller('abastecimentos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AbastecimentoController {
  constructor(private readonly abastecimentoService: AbastecimentoService) {}

  @Post()
  @UseGuards(EmpresaGuard)
  @UseInterceptors(
    FileInterceptor('nfe_img', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiOperation({ summary: 'Criar novo abastecimento' })
  @ApiResponse({ status: 201, description: 'Abastecimento criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateAbastecimentoDto) },
        {
          type: 'object',
          properties: {
            nfe_img: {
              type: 'string',
              format: 'binary',
              description: 'Imagem da nota fiscal (opcional)',
            },
          },
        },
      ],
    },
  })
  async create(
    @Body() createAbastecimentoDto: any,
    @Request() req,
    @UploadedFile() nfeImgFile?: Express.Multer.File,
  ) {
    const processedDto: CreateAbastecimentoDto = {
      ...createAbastecimentoDto,
      veiculoId: this.parseRequiredIntField(createAbastecimentoDto.veiculoId, 'veiculoId'),
      motoristaId: this.parseOptionalIntField(createAbastecimentoDto.motoristaId, 'motoristaId'),
      combustivelId: this.parseRequiredIntField(createAbastecimentoDto.combustivelId, 'combustivelId'),
      empresaId: this.parseRequiredIntField(createAbastecimentoDto.empresaId, 'empresaId'),
      solicitanteId: this.parseOptionalIntField(createAbastecimentoDto.solicitanteId, 'solicitanteId'),
      abastecedorId: this.parseOptionalIntField(createAbastecimentoDto.abastecedorId, 'abastecedorId'),
      validadorId: this.parseOptionalIntField(createAbastecimentoDto.validadorId, 'validadorId'),
      tipo_abastecimento: createAbastecimentoDto.tipo_abastecimento,
      quantidade: this.parseRequiredFloatField(createAbastecimentoDto.quantidade, 'quantidade'),
      preco_anp: this.parseOptionalFloatField(createAbastecimentoDto.preco_anp, 'preco_anp'),
      preco_empresa: this.parseOptionalFloatField(createAbastecimentoDto.preco_empresa, 'preco_empresa'),
      desconto: this.parseOptionalFloatField(createAbastecimentoDto.desconto, 'desconto'),
      valor_total: this.parseRequiredFloatField(createAbastecimentoDto.valor_total, 'valor_total'),
      odometro: this.parseOptionalIntField(createAbastecimentoDto.odometro, 'odometro'),
      orimetro: this.parseOptionalIntField(createAbastecimentoDto.orimetro, 'orimetro'),
      status: createAbastecimentoDto.status,
      motivo_rejeicao: createAbastecimentoDto.motivo_rejeicao,
      abastecido_por: createAbastecimentoDto.abastecido_por,
      nfe_chave_acesso: createAbastecimentoDto.nfe_chave_acesso,
      nfe_img_url: createAbastecimentoDto.nfe_img_url,
      nfe_link: createAbastecimentoDto.nfe_link,
      observacao: createAbastecimentoDto.observacao,
      conta_faturamento_orgao_id: this.parseOptionalIntField(
        createAbastecimentoDto.conta_faturamento_orgao_id,
        'conta_faturamento_orgao_id',
      ),
      cota_id: this.parseOptionalIntField(createAbastecimentoDto.cota_id, 'cota_id'),
      ativo: this.parseOptionalBooleanField(createAbastecimentoDto.ativo, 'ativo'),
    };

    return this.abastecimentoService.create(processedDto, req.user, nfeImgFile);
  }

  @Post('from-solicitacao')
  @UseGuards(EmpresaGuard)
  @ApiOperation({ 
    summary: 'Criar abastecimento a partir de uma solicitação de abastecimento',
    description: 'Cria um abastecimento a partir de uma solicitação. Se a solicitação estiver PENDENTE, será automaticamente aprovada antes de criar o abastecimento. Após criar o abastecimento, a solicitação permanecerá com status APROVADA e será vinculada ao abastecimento criado.'
  })
  @ApiResponse({ status: 201, description: 'Abastecimento criado a partir da solicitação com sucesso. Se a solicitação estava PENDENTE, foi aprovada automaticamente.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos, solicitação expirada, rejeitada ou inativa' })
  @ApiResponse({ status: 404, description: 'Solicitação não encontrada' })
  @ApiResponse({ status: 409, description: 'Solicitação já possui abastecimento vinculado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos' })
  async createFromSolicitacao(
    @Body() createDto: CreateAbastecimentoFromSolicitacaoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.createFromSolicitacao(createDto, req.user);
  }

  @Post('from-qrcode-veiculo')
  @UseGuards(EmpresaGuard)
  @ApiOperation({ 
    summary: 'Criar abastecimento a partir de uma solicitação de QR Code de veículo',
    description: 'Cria um abastecimento a partir de uma solicitação de QR Code de veículo usando o código QR code. Esta rota é exclusiva para veículos com tipo_abastecimento LIVRE ou COM_AUTORIZACAO. Preenche automaticamente: veiculoId, motoristaId (se houver vinculado ao veículo ou se informado no body), empresaId (do usuário logado ou se informado no body), solicitanteId, abastecedorId e validadorId (do usuário logado). Valida capacidade_tanque do veículo e CotaOrgao.restante. Atualiza automaticamente CotaOrgao e Processo após criar o abastecimento.'
  })
  @ApiResponse({ status: 201, description: 'Abastecimento criado com sucesso a partir da solicitação de QR Code veículo' })
  @ApiResponse({ status: 400, description: 'Dados inválidos, quantidade excede capacidade do tanque ou cota insuficiente' })
  @ApiResponse({ status: 404, description: 'Solicitação de QR Code veículo não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas ADMIN_EMPRESA ou COLABORADOR_EMPRESA podem criar abastecimentos' })
  async createFromQrCodeVeiculo(
    @Body() createDto: CreateAbastecimentoFromQrCodeVeiculoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.createFromQrCodeVeiculo(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar abastecimentos com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de abastecimentos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiQuery({ name: 'veiculoId', required: false, description: 'Filtrar por veículo' })
  @ApiQuery({ name: 'motoristaId', required: false, description: 'Filtrar por motorista' })
  @ApiQuery({ name: 'combustivelId', required: false, description: 'Filtrar por combustível' })
  @ApiQuery({ name: 'empresaId', required: false, description: 'Filtrar por empresa' })
  @ApiQuery({ name: 'prefeituraId', required: false, description: 'Filtrar por prefeitura (através do veículo)' })
  @ApiQuery({ name: 'tipo_abastecimento', required: false, description: 'Filtrar por tipo de abastecimento' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'ativo', required: false, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'data_inicial', required: false, description: 'Data inicial para filtro' })
  @ApiQuery({ name: 'data_final', required: false, description: 'Data final para filtro' })
  @ApiQuery({ name: 'page', required: false, description: 'Página para paginação' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de itens por página' })
  async findAll(@Query() findAbastecimentoDto: FindAbastecimentoDto) {
    return this.abastecimentoService.findAll(findAbastecimentoDto);
  }

  @Get('veiculo/tipo/abastecimento/:veiculoId/:qntLitros')
  @ApiOperation({ 
    summary: 'Verificar tipo de abastecimento e cota do veículo',
    description: 'Verifica se a quantidade de litros informada excede a cota do veículo. Retorna informações sobre o consumo no período (diário, semanal ou mensal) baseado na periodicidade configurada no veículo. Considera apenas abastecimentos aprovados no período.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informações sobre a cota do veículo retornadas com sucesso',
    schema: {
      example: {
        message: 'A quantidade solicitada (30.0 litros) está dentro da cota diária do veículo. Cota disponível: 70.00 litros. Limite: 100.00 litros. Quantidade já utilizada no período: 30.00 litros. Após este abastecimento, restará: 40.00 litros.',
        excedeu: false,
        veiculo: {
          id: 1,
          nome: 'Veículo 1',
          placa: 'ABC-1234',
          tipo_abastecimento: 'COTA',
          periodicidade: 'Diario',
          periodicidadeNome: 'Diária'
        },
        cota: {
          quantidadeLimite: 100,
          quantidadeUtilizada: 30,
          quantidadeDisponivel: 70,
          quantidadeSolicitada: 30,
          novaQuantidadeTotal: 60,
          excedeuPor: 0
        },
        periodo: {
          inicio: '2025-01-15T00:00:00.000Z',
          fim: '2025-01-15T23:59:59.999Z',
          tipo: 'Diária'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 400, description: 'Quantidade de litros inválida' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async verificarTipoAbastecimentoVeiculo(
    @Param('veiculoId', ParseIntPipe) veiculoId: number,
    @Param('qntLitros') qntLitrosParam: string,
  ) {
    const qntLitros = parseFloat(qntLitrosParam);
    
    if (isNaN(qntLitros) || qntLitros <= 0) {
      throw new BadRequestException('Quantidade de litros deve ser um número positivo maior que zero');
    }
    
    return this.abastecimentoService.verificarTipoAbastecimentoVeiculo(veiculoId, qntLitros);
  }

  @Get('app/abastecimento/:id')
  @ApiOperation({ summary: 'Buscar abastecimento por ID com informações de cota do período' })
  @ApiResponse({ 
    status: 200, 
    description: 'Abastecimento encontrado com sucesso incluindo informações da cota do período',
    schema: {
      example: {
        message: 'Abastecimento encontrado com sucesso',
        abastecimento: {
          id: 1,
          veiculoId: 1,
          data_abastecimento: '2025-01-20T10:00:00.000Z',
          cota_periodo: {
            id: 1,
            quantidade_total: 500.0,
            quantidade_utilizada: 150.0,
            quantidade_disponivel: 350.0,
            data_inicio_periodo: '2025-01-01T00:00:00.000Z',
            data_fim_periodo: '2025-01-31T23:59:59.999Z',
            periodicidade: 'Mensal'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOneWithCotaPeriodo(@Param('id', ParseIntPipe) id: number) {
    return this.abastecimentoService.findOneWithCotaPeriodo(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar abastecimento por ID' })
  @ApiResponse({ status: 200, description: 'Abastecimento encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.abastecimentoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbastecimentoDto: UpdateAbastecimentoDto,
    @Request() req,
  ) {
    return this.abastecimentoService.update(id, updateAbastecimentoDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.abastecimentoService.remove(id, req.user);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Aprovar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento aprovado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação ou já foi processado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.abastecimentoService.approve(id, req.user.id, req.user.email, req.user);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Rejeitar abastecimento' })
  @ApiResponse({ status: 200, description: 'Abastecimento rejeitado com sucesso' })
  @ApiResponse({ status: 404, description: 'Abastecimento não encontrado' })
  @ApiResponse({ status: 400, description: 'Abastecimento não está aguardando aprovação, motivo da rejeição não informado ou já foi processado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.abastecimentoService.reject(id, req.user.id, req.user.email, motivo, req.user);
  }

  private parseIntValue(value: any): number | undefined {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseRequiredIntField(value: any, fieldName: string): number {
    const parsed = this.parseIntValue(value);
    if (parsed === undefined) {
      throw new BadRequestException(`Campo "${fieldName}" deve ser um número inteiro válido`);
    }
    return parsed;
  }

  private parseOptionalIntField(value: any, fieldName: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = this.parseIntValue(value);
    if (parsed === undefined) {
      throw new BadRequestException(`Campo "${fieldName}" deve ser um número inteiro válido`);
    }
    return parsed;
  }

  private parseFloatValue(value: any): number | undefined {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const normalized = value.replace(',', '.');
      const parsed = parseFloat(normalized);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private parseRequiredFloatField(value: any, fieldName: string): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`Campo "${fieldName}" é obrigatório`);
    }
    const parsed = this.parseFloatValue(value);
    if (parsed === undefined) {
      throw new BadRequestException(`Campo "${fieldName}" deve ser um número decimal válido`);
    }
    return parsed;
  }

  private parseOptionalFloatField(value: any, fieldName: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = this.parseFloatValue(value);
    if (parsed === undefined) {
      throw new BadRequestException(`Campo "${fieldName}" deve ser um número decimal válido`);
    }
    return parsed;
  }

  private parseOptionalDateField(value: any, fieldName: string): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Campo "${fieldName}" deve ser uma data válida`);
    }

    return parsed.toISOString();
  }

  private parseOptionalBooleanField(value: any, fieldName: string): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return true;
      }
      if (value.toLowerCase() === 'false') {
        return false;
      }
    }
    throw new BadRequestException(`Campo "${fieldName}" deve ser um valor booleano válido`);
  }
}
