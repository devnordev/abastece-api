import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoRegraAlerta } from '@prisma/client';

export class CreateRegraAlertaDto {
  @ApiProperty({
    description: 'Nome da regra de alerta',
    example: 'Múltiplos Abastecimentos no Dia',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Descrição da regra',
    example: 'Alerta quando um veículo abastece mais de X vezes no mesmo dia',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Tipo da regra de alerta',
    enum: TipoRegraAlerta,
    example: TipoRegraAlerta.MULTIPLOS_ABASTECIMENTOS_DIA,
  })
  @IsEnum(TipoRegraAlerta)
  tipo: TipoRegraAlerta;

  @ApiProperty({
    description: 'Se a regra está ativa',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

