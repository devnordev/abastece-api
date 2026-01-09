import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiPropertyOptional, ApiQuery } from '@nestjs/swagger';
import { TipoEntidadeExportacao, FormatoExportacao } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindExportModelDto {
  @ApiPropertyOptional({
    description: 'Tipo de entidade para filtrar modelos',
    enum: TipoEntidadeExportacao,
    example: TipoEntidadeExportacao.SOLICITACOES,
  })
  @IsOptional()
  @IsEnum(TipoEntidadeExportacao, { message: 'Tipo de entidade inválido' })
  entityType?: TipoEntidadeExportacao;

  @ApiPropertyOptional({
    description: 'Formato para filtrar modelos',
    enum: FormatoExportacao,
    example: FormatoExportacao.PDF,
  })
  @IsOptional()
  @IsEnum(FormatoExportacao, { message: 'Formato de exportação inválido' })
  format?: FormatoExportacao;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Type(() => Number)
  limit?: number;
}


