import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsString } from 'class-validator';
import { StatusPreco } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindEmpresaPrecoCombustivelDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'ID do combustível para filtrar',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  @Type(() => Number)
  combustivel_id?: number;

  @ApiPropertyOptional({
    description: 'Status do preço para filtrar',
    enum: StatusPreco,
    example: StatusPreco.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusPreco, { message: 'Status inválido' })
  status?: StatusPreco;

  @ApiPropertyOptional({
    description: 'UF de referência para filtrar',
    example: 'SP',
  })
  @IsOptional()
  @IsString({ message: 'UF de referência deve ser uma string' })
  uf_referencia?: string;
}

