import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { StatusSolicitacaoRastreamento } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindSolicitacaoRastreamentoDto {
  @ApiPropertyOptional({ description: 'ID da prefeitura', example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  prefeituraId?: number;

  @ApiPropertyOptional({ description: 'ID do veículo', example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  veiculoId?: number;

  @ApiPropertyOptional({ 
    description: 'Status da solicitação', 
    enum: StatusSolicitacaoRastreamento 
  })
  @IsEnum(StatusSolicitacaoRastreamento)
  @IsOptional()
  status?: StatusSolicitacaoRastreamento;

  @ApiPropertyOptional({ description: 'Página', example: 1, default: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', example: 20, default: 20 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  perPage?: number = 20;
}
