import { IsOptional, IsString, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindVeiculoDto {
  @ApiProperty({
    description: 'Nome do veículo para busca',
    example: 'Ambulância',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'Placa do veículo para busca',
    example: 'ABC-1234',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Placa deve ser uma string' })
  placa?: string;

  @ApiProperty({
    description: 'Modelo do veículo para busca',
    example: 'Ford',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Modelo deve ser uma string' })
  modelo?: string;

  @ApiProperty({
    description: 'Tipo do veículo para filtro',
    enum: TipoVeiculo,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoVeiculo, { message: 'Tipo de veículo inválido' })
  tipo_veiculo?: TipoVeiculo;

  @ApiProperty({
    description: 'Situação do veículo para filtro',
    enum: SituacaoVeiculo,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoVeiculo, { message: 'Situação do veículo inválida' })
  situacao_veiculo?: SituacaoVeiculo;

  @ApiProperty({
    description: 'Tipo de abastecimento para filtro',
    enum: TipoAbastecimentoVeiculo,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoAbastecimentoVeiculo, { message: 'Tipo de abastecimento inválido' })
  tipo_abastecimento?: TipoAbastecimentoVeiculo;

  @ApiProperty({
    description: 'Periodicidade para filtro',
    enum: Periodicidade,
    required: false,
  })
  @IsOptional()
  @IsEnum(Periodicidade, { message: 'Periodicidade inválida' })
  periodicidade?: Periodicidade;

  @ApiProperty({
    description: 'Filtrar por veículos ativos',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'ID da prefeitura para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId?: number;

  @ApiProperty({
    description: 'ID do órgão para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do órgão deve ser um número inteiro' })
  orgaoId?: number;

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
