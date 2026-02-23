import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSolicitacaoRastreamentoDto {
  @ApiProperty({ description: 'ID do veículo', example: 1 })
  @IsInt()
  @IsNotEmpty()
  veiculoId: number;

  @ApiPropertyOptional({ description: 'Motivo da solicitação', example: 'Necessário para monitoramento de rotas' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  motivo?: string;

  @ApiPropertyOptional({ description: 'Observações adicionais', example: 'Veículo utilizado para transporte escolar' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacoes?: string;
}
