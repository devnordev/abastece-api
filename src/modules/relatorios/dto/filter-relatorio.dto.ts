import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterRelatorioDto {
  @ApiPropertyOptional({
    description: 'Data inicial do período (formato ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida' })
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final do período (formato ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser uma data válida' })
  dataFim?: string;

  @ApiPropertyOptional({
    description: 'ID do órgão para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do órgão deve ser um número inteiro' })
  orgaoId?: number;

  @ApiPropertyOptional({
    description: 'ID do combustível para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  combustivelId?: number;

  @ApiPropertyOptional({
    description: 'ID do veículo para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId?: number;

  @ApiPropertyOptional({
    description: 'ID da empresa para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId?: number;

  @ApiPropertyOptional({
    description: 'Número de meses para análise (padrão: 12)',
    example: 12,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Número de meses deve ser um número inteiro' })
  @Min(1, { message: 'Número de meses deve ser maior que zero' })
  meses?: number;
}

