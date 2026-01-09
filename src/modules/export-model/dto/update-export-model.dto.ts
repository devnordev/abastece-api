import { PartialType } from '@nestjs/swagger';
import { CreateExportModelDto } from './create-export-model.dto';
import { IsOptional, IsArray, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEntidadeExportacao, FormatoExportacao, VisibilidadeModelo } from '@prisma/client';

export class UpdateExportModelDto extends PartialType(CreateExportModelDto) {
  @ApiPropertyOptional({
    description: 'Título do modelo de exportação',
    example: 'Relatório Mensal de Solicitações',
    minLength: 3,
  })
  @IsOptional()
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(3, { message: 'Título deve ter pelo menos 3 caracteres' })
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Tipo de entidade para exportação',
    enum: TipoEntidadeExportacao,
    example: TipoEntidadeExportacao.SOLICITACOES,
  })
  @IsOptional()
  entityType?: TipoEntidadeExportacao;

  @ApiPropertyOptional({
    description: 'Formato de exportação',
    enum: FormatoExportacao,
    example: FormatoExportacao.PDF,
  })
  @IsOptional()
  format?: FormatoExportacao;

  @ApiPropertyOptional({
    description: 'Visibilidade do modelo',
    enum: VisibilidadeModelo,
    example: VisibilidadeModelo.PUBLIC,
  })
  @IsOptional()
  visibility?: VisibilidadeModelo;

  @ApiPropertyOptional({
    description: 'IDs das colunas selecionadas para exportação',
    example: ['nomeEmpresa', 'quantidade', 'dataSolicitacao'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Colunas deve ser um array' })
  @IsString({ each: true, message: 'Cada coluna deve ser uma string' })
  columns?: string[];
}


