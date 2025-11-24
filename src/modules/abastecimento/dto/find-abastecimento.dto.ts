import { IsOptional, IsString, IsBoolean, IsEnum, IsInt, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindAbastecimentoDto {
  @ApiProperty({
    description: 'ID do veículo para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId?: number;

  @ApiProperty({
    description: 'ID do motorista para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do motorista deve ser um número inteiro' })
  motoristaId?: number;

  @ApiProperty({
    description: 'ID do combustível para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  combustivelId?: number;

  @ApiProperty({
    description: 'ID da empresa para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId?: number;

  @ApiProperty({
    description: 'ID da prefeitura para filtro (filtra através do veículo)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId?: number;

  @ApiProperty({
    description: 'Tipo de abastecimento para filtro',
    enum: TipoAbastecimento,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoAbastecimento, { message: 'Tipo de abastecimento inválido' })
  tipo_abastecimento?: TipoAbastecimento;

  @ApiProperty({
    description: 'Status do abastecimento para filtro',
    enum: StatusAbastecimento,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAbastecimento, { message: 'Status do abastecimento inválido' })
  status?: StatusAbastecimento;

  @ApiProperty({
    description: 'Filtrar por abastecimentos ativos',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'Data inicial para filtro (formato ISO)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser uma data válida' })
  data_inicial?: string;

  @ApiProperty({
    description: 'Data final para filtro (formato ISO)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser uma data válida' })
  data_final?: string;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  page?: number = 1;

  @ApiProperty({
    description: 'Limite de itens por página',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  limit?: number = 10;
}
