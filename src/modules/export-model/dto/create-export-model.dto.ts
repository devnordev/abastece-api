import { IsString, MinLength, IsEnum, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoEntidadeExportacao, FormatoExportacao, VisibilidadeModelo } from '@prisma/client';

export class CreateExportModelDto {
  @ApiProperty({
    description: 'Título do modelo de exportação',
    example: 'Relatório Mensal de Solicitações',
    minLength: 3,
  })
  @IsString({ message: 'Título deve ser uma string' })
  @IsNotEmpty({ message: 'Título é obrigatório' })
  @MinLength(3, { message: 'Título deve ter pelo menos 3 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'Tipo de entidade para exportação',
    enum: TipoEntidadeExportacao,
    example: TipoEntidadeExportacao.SOLICITACOES,
  })
  @IsEnum(TipoEntidadeExportacao, { message: 'Tipo de entidade inválido' })
  entityType: TipoEntidadeExportacao;

  @ApiProperty({
    description: 'Formato de exportação',
    enum: FormatoExportacao,
    example: FormatoExportacao.PDF,
  })
  @IsEnum(FormatoExportacao, { message: 'Formato de exportação inválido' })
  format: FormatoExportacao;

  @ApiProperty({
    description: 'Visibilidade do modelo',
    enum: VisibilidadeModelo,
    example: VisibilidadeModelo.PRIVATE,
    required: false,
    default: VisibilidadeModelo.PRIVATE,
  })
  @IsEnum(VisibilidadeModelo, { message: 'Visibilidade inválida' })
  visibility?: VisibilidadeModelo;

  @ApiProperty({
    description: 'IDs das colunas selecionadas para exportação',
    example: ['nomeEmpresa', 'quantidade', 'dataSolicitacao'],
    type: [String],
  })
  @IsArray({ message: 'Colunas deve ser um array' })
  @IsString({ each: true, message: 'Cada coluna deve ser uma string' })
  @IsNotEmpty({ message: 'Deve ter pelo menos uma coluna selecionada' })
  columns: string[];
}


