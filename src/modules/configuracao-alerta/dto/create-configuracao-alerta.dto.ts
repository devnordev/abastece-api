import { IsInt, IsNumber, IsOptional, IsBoolean, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateConfiguracaoAlertaDto {
  @ApiProperty({
    description: 'ID da prefeitura',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  prefeituraId: number;

  @ApiProperty({
    description: 'ID da regra de alerta',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  regraAlertaId: number;

  @ApiProperty({
    description: 'Valor limite para o alerta (ex: 3 abastecimentos)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valorLimite?: number;

  @ApiProperty({
    description: 'Percentual limite para o alerta (ex: 160 para 160%)',
    example: 160,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  percentualLimite?: number;

  @ApiProperty({
    description: 'Período em dias para análise',
    example: 7,
    required: false,
    default: 7,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  periodoDias?: number;

  @ApiProperty({
    description: 'Se a configuração está ativa',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({
    description: 'Observações sobre a configuração',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

