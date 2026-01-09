import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExportModelService } from './export-model.service';
import { CreateExportModelDto } from './dto/create-export-model.dto';
import { UpdateExportModelDto } from './dto/update-export-model.dto';
import { FindExportModelDto } from './dto/find-export-model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminPrefeituraEmpresaColaboradorGuard } from '../auth/guards/admin-prefeitura-empresa-colaborador.guard';

@ApiTags('Modelos de Exportação')
@Controller('export-models')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportModelController {
  constructor(private readonly exportModelService: ExportModelService) {}

  @Post()
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Criar modelo de exportação' })
  @ApiResponse({ status: 201, description: 'Modelo criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas usuários da prefeitura podem criar modelos' })
  async create(@Body() createDto: CreateExportModelDto, @Request() req) {
    return this.exportModelService.create(req.user, createDto);
  }

  @Get()
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Listar modelos de exportação' })
  @ApiResponse({ status: 200, description: 'Modelos encontrados com sucesso' })
  @ApiResponse({ status: 403, description: 'Apenas usuários da prefeitura podem listar modelos' })
  async findAll(@Query() query: FindExportModelDto, @Request() req) {
    return this.exportModelService.findAll(req.user, query);
  }

  @Get(':id')
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Buscar modelo de exportação por ID' })
  @ApiResponse({ status: 200, description: 'Modelo encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 403, description: 'Você não tem permissão para visualizar este modelo' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.exportModelService.findOne(req.user, id);
  }

  @Put(':id')
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Atualizar modelo de exportação' })
  @ApiResponse({ status: 200, description: 'Modelo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas o criador pode editar o modelo' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExportModelDto,
    @Request() req,
  ) {
    return this.exportModelService.update(req.user, id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AdminPrefeituraEmpresaColaboradorGuard)
  @ApiOperation({ summary: 'Deletar modelo de exportação' })
  @ApiResponse({ status: 200, description: 'Modelo deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 403, description: 'Apenas o criador pode deletar o modelo' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.exportModelService.remove(req.user, id);
  }
}

