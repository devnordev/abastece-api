import { IsOptional, IsInt, IsEnum, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatusProcesso } from '@prisma/client';

export class FindProcessoDto {
  @ApiPropertyOptional({
    description: 'Número da página para paginação',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A página deve ser um número inteiro' })
  @Min(1, { message: 'A página deve ser maior ou igual a 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite deve ser um número inteiro' })
  @Min(1, { message: 'O limite deve ser maior ou igual a 1' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'ID da prefeitura para filtrar processos (opcional)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID da prefeitura deve ser um número inteiro' })
  prefeituraId?: number;

  @ApiPropertyOptional({
    description: 'Status do processo para filtrar',
    enum: StatusProcesso,
    example: StatusProcesso.ATIVO,
  })
  @IsOptional()
  @IsEnum(StatusProcesso, { message: 'Status inválido' })
  status?: StatusProcesso;

  @ApiPropertyOptional({
    description: 'Filtrar por processos ativos/inativos',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'O campo ativo deve ser um valor booleano' })
  ativo?: boolean;
}

