import { IsOptional, IsString, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoUsuario, StatusAcesso } from '@prisma/client';

export class FindUsuarioDto {
  @ApiProperty({
    description: 'Nome do usuário para busca',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'Email do usuário para busca',
    example: 'usuario@exemplo.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email?: string;

  @ApiProperty({
    description: 'CPF do usuário para busca',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  cpf?: string;

  @ApiProperty({
    description: 'Tipo do usuário para filtro',
    enum: TipoUsuario,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoUsuario, { message: 'Tipo de usuário inválido' })
  tipo_usuario?: TipoUsuario;

  @ApiProperty({
    description: 'Status de acesso para filtro',
    enum: StatusAcesso,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAcesso, { message: 'Status de acesso inválido' })
  statusAcess?: StatusAcesso;

  @ApiProperty({
    description: 'Filtrar por usuários ativos',
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
    description: 'ID da empresa para filtro',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId?: number;

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
