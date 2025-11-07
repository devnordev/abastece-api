import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, IsString, IsOptional, Min, Max, Length } from 'class-validator';
import { AnpBase, StatusPreco } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateEmpresaPrecoCombustivelDto {
  @ApiPropertyOptional({
    description: 'ID do combustível',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  @Type(() => Number)
  combustivel_id?: number;

  @ApiPropertyOptional({
    description: 'Preço atual do combustível',
    example: 5.89,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço atual deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Preço atual deve ser maior ou igual a 0' })
  @Type(() => Number)
  preco_atual?: number;

  @ApiPropertyOptional({
    description: 'Teto vigente do preço',
    example: 6.50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Teto vigente deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Teto vigente deve ser maior ou igual a 0' })
  @Type(() => Number)
  teto_vigente?: number;

  @ApiPropertyOptional({
    description: 'Base ANP utilizada',
    enum: AnpBase,
    example: AnpBase.MEDIO,
  })
  @IsOptional()
  @IsEnum(AnpBase, { message: 'Base ANP inválida' })
  anp_base?: AnpBase;

  @ApiPropertyOptional({
    description: 'Valor da base ANP',
    example: 5.50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor da base ANP deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Valor da base ANP deve ser maior ou igual a 0' })
  @Type(() => Number)
  anp_base_valor?: number;

  @ApiPropertyOptional({
    description: 'Margem percentual aplicada',
    example: 5.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Margem percentual deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Margem percentual deve ser maior ou igual a 0' })
  @Max(100, { message: 'Margem percentual deve ser menor ou igual a 100' })
  @Type(() => Number)
  margem_app_pct?: number;

  @ApiPropertyOptional({
    description: 'UF de referência (2 caracteres)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString({ message: 'UF de referência deve ser uma string' })
  @Length(2, 2, { message: 'UF de referência deve ter exatamente 2 caracteres' })
  uf_referencia?: string;

  @ApiPropertyOptional({
    description: 'Status do preço',
    enum: StatusPreco,
    example: StatusPreco.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StatusPreco, { message: 'Status inválido' })
  status?: StatusPreco;

  @ApiPropertyOptional({
    description: 'Usuário que atualizou o registro',
    example: 'admin@empresa.com',
  })
  @IsOptional()
  @IsString({ message: 'Usuário que atualizou deve ser uma string' })
  updated_by?: string;
}

