import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatusQrCodeMotorista } from '@prisma/client';

export class FilterSolicitacoesDto {
  @ApiProperty({
    description: 'ID da prefeitura para filtrar solicitações',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  @Min(1, { message: 'ID da prefeitura deve ser maior que zero' })
  prefeituraId?: number;

  @ApiProperty({
    description: 'Status da solicitação para filtrar',
    enum: StatusQrCodeMotorista,
    required: false,
    example: 'Solicitado',
  })
  @IsOptional()
  @IsEnum(StatusQrCodeMotorista, {
    message: 'Status inválido',
  })
  status?: StatusQrCodeMotorista;

  @ApiProperty({
    description: 'Número da página',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior que zero' })
  page?: number = 1;

  @ApiProperty({
    description: 'Limite de itens por página',
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior que zero' })
  limit?: number = 10;
}

