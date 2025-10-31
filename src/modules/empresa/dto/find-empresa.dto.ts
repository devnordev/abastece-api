import { IsOptional, IsString, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UF, TipoEmpresa } from '@prisma/client';
import { Type } from 'class-transformer';

export class FindEmpresaDto {
  @ApiProperty({
    description: 'Nome da empresa para busca',
    example: 'Shell',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'CNPJ da empresa para busca',
    example: '12345678000195',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CNPJ deve ser uma string' })
  cnpj?: string;

  @ApiProperty({
    description: 'UF para filtro',
    enum: UF,
    required: false,
  })
  @IsOptional()
  @IsEnum(UF, { message: 'UF inválida' })
  uf?: UF;

  @ApiProperty({
    description: 'Tipo da empresa para filtro',
    enum: TipoEmpresa,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoEmpresa, { message: 'Tipo de empresa inválido' })
  tipo_empresa?: TipoEmpresa;

  @ApiProperty({
    description: 'Filtrar por empresas ativas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'Filtrar por empresas públicas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'IsPublic deve ser um valor booleano' })
  isPublic?: boolean;

  @ApiProperty({
    description: 'Bandeira para filtro',
    example: 'Shell',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bandeira deve ser uma string' })
  bandeira?: string;

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
