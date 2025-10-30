import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindMotoristaDto {
  @ApiProperty({
    description: 'Nome do motorista para busca',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'CPF do motorista para busca',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  cpf?: string;

  @ApiProperty({
    description: 'CNH do motorista para busca',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CNH deve ser uma string' })
  cnh?: string;

  @ApiProperty({
    description: 'Filtrar por motoristas ativos',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'ID da prefeitura para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId?: number;

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
