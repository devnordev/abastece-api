import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoUsuario, StatusAcesso } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;

  @ApiProperty({
    description: 'CPF do usuário',
    example: '12345678901',
  })
  @IsString({ message: 'CPF deve ser uma string' })
  cpf: string;

  @ApiProperty({
    description: 'Tipo do usuário',
    enum: TipoUsuario,
    example: TipoUsuario.COLABORADOR_PREFEITURA,
  })
  @IsEnum(TipoUsuario, { message: 'Tipo de usuário inválido' })
  tipo_usuario: TipoUsuario;

  @ApiProperty({
    description: 'ID da prefeitura (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId?: number;

  @ApiProperty({
    description: 'ID da empresa (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId?: number;

  @ApiProperty({
    description: 'Telefone do usuário (opcional)',
    example: '11999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @ApiProperty({
    description: 'Status de acesso do usuário',
    enum: StatusAcesso,
    example: StatusAcesso.Acesso_solicitado,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAcesso, { message: 'Status de acesso inválido' })
  statusAcess?: StatusAcesso;

  @ApiProperty({
    description: 'Se o usuário está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;
}
