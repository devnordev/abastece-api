import { ApiProperty } from '@nestjs/swagger';
import { StatusAcesso } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class FindColaboradorEmpresaDto {
  @ApiProperty({
    description: 'Termo para buscar por nome, email ou CPF',
    example: 'Maria',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  search?: string;

  @ApiProperty({
    description: 'Filtrar por status de acesso',
    enum: StatusAcesso,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAcesso, { message: 'Status inválido' })
  statusAcess?: StatusAcesso;

  @ApiProperty({
    description: 'Filtrar por status ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser booleano' })
  ativo?: boolean;

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

