import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPrefeituraDto {
  @ApiProperty({
    description: 'Nome da prefeitura para busca',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'CNPJ da prefeitura para busca',
    example: '12345678000195',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CNPJ deve ser uma string' })
  cnpj?: string;

  @ApiProperty({
    description: 'Email administrativo para busca',
    example: 'admin@prefeitura',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email_administrativo?: string;

  @ApiProperty({
    description: 'Filtrar por prefeituras ativas',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'Página para paginação',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Página deve ser um número inteiro' })
  page?: number = 1;

  @ApiProperty({
    description: 'Limite de itens por página',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  limit?: number = 10;
}
