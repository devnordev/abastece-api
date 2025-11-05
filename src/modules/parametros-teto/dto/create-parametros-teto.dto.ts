import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { AnpBase } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateParametrosTetoDto {
  @ApiPropertyOptional({
    description: 'Base ANP utilizada para cálculo do teto',
    enum: AnpBase,
    default: AnpBase.MEDIO,
  })
  @IsOptional()
  @IsEnum(AnpBase)
  anp_base?: AnpBase;

  @ApiPropertyOptional({
    description: 'Margem percentual aplicada',
    type: Number,
    minimum: 0,
    maximum: 100,
    example: 5.5,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Margem percentual deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Margem percentual deve ser maior ou igual a 0' })
  @Max(100, { message: 'Margem percentual deve ser menor ou igual a 100' })
  @Type(() => Number)
  margem_pct?: number;

  @ApiPropertyOptional({
    description: 'Exceções de combustível (texto livre)',
    type: String,
  })
  @IsOptional()
  @IsString()
  excecoes_combustivel?: string;

  @ApiPropertyOptional({
    description: 'Status ativo do parâmetro',
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    type: String,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

