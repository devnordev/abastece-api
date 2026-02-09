import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatusAlerta } from '@prisma/client';

export class FindAlertaDto {
  @ApiProperty({
    description: 'Status do alerta',
    enum: StatusAlerta,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAlerta)
  status?: StatusAlerta;

  @ApiProperty({
    description: 'ID do veículo',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  veiculoId?: number;

  @ApiProperty({
    description: 'Limite de resultados',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}

