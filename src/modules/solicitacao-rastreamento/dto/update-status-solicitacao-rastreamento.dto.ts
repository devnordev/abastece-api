import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusSolicitacaoRastreamento } from '@prisma/client';

export class UpdateStatusSolicitacaoRastreamentoDto {
  @ApiProperty({ 
    description: 'Novo status da solicitação', 
    enum: StatusSolicitacaoRastreamento,
    example: StatusSolicitacaoRastreamento.APROVADA 
  })
  @IsEnum(StatusSolicitacaoRastreamento)
  @IsNotEmpty()
  status: StatusSolicitacaoRastreamento;

  @ApiPropertyOptional({ description: 'Observações sobre a aprovação/rejeição', example: 'Aprovado conforme política da prefeitura' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacoes?: string;
}
