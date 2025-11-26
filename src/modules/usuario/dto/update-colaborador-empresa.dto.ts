import { ApiProperty } from '@nestjs/swagger';
import { StatusAcesso } from '@prisma/client';
import { IsOptional, IsString, MinLength, IsBoolean, IsEnum } from 'class-validator';

export class UpdateColaboradorEmpresaDto {
  @ApiProperty({
    description: 'Email do colaborador (opcional)',
    example: 'colaborador@empresa.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email?: string;

  @ApiProperty({
    description: 'Senha do colaborador (opcional)',
    example: 'novaSenha123',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha?: string;

  @ApiProperty({
    description: 'Nome completo do colaborador (opcional)',
    example: 'Maria Oliveira',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  nome?: string;

  @ApiProperty({
    description: 'CPF do colaborador (opcional)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  cpf?: string;

  @ApiProperty({
    description: 'Telefone do colaborador (opcional)',
    example: '(19) 98888-0000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @ApiProperty({
    description: 'Status de acesso (opcional)',
    enum: StatusAcesso,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAcesso, { message: 'Status inválido' })
  statusAcess?: StatusAcesso;

  @ApiProperty({
    description: 'Status ativo (opcional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser booleano' })
  ativo?: boolean;
}

