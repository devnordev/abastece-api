import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusSolicitacao, TipoAbastecimentoSolicitacao } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class FindSolicitacaoAbastecimentoDto {
  @ApiPropertyOptional({ description: 'Página atual', example: 1 })
  @IsOptional()
  @IsInt({ message: 'page deve ser um inteiro' })
  @IsPositive({ message: 'page deve ser maior que zero' })
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de registros por página', example: 10 })
  @IsOptional()
  @IsInt({ message: 'limit deve ser um inteiro' })
  @IsPositive({ message: 'limit deve ser maior que zero' })
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrar por prefeitura', example: 1 })
  @IsOptional()
  @IsInt({ message: 'prefeituraId deve ser um inteiro' })
  @Type(() => Number)
  prefeituraId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por veículo', example: 5 })
  @IsOptional()
  @IsInt({ message: 'veiculoId deve ser um inteiro' })
  @Type(() => Number)
  veiculoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por motorista', example: 3 })
  @IsOptional()
  @IsInt({ message: 'motoristaId deve ser um inteiro' })
  @Type(() => Number)
  motoristaId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por empresa', example: 4 })
  @IsOptional()
  @IsInt({ message: 'empresaId deve ser um inteiro' })
  @Type(() => Number)
  empresaId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de abastecimento', enum: TipoAbastecimentoSolicitacao })
  @IsOptional()
  @IsEnum(TipoAbastecimentoSolicitacao, { message: 'tipo_abastecimento inválido' })
  tipo_abastecimento?: TipoAbastecimentoSolicitacao;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: StatusSolicitacao })
  @IsOptional()
  @IsEnum(StatusSolicitacao, { message: 'status inválido' })
  status?: StatusSolicitacao;

  @ApiPropertyOptional({ description: 'Filtrar por ativo', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 'true';
  })
  ativo?: boolean;
}

