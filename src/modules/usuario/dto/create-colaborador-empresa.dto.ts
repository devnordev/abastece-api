import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateColaboradorEmpresaDto {
  @ApiProperty({
    description: 'Email do colaborador',
    example: 'colaborador@empresa.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do colaborador',
    example: 'senha123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @ApiProperty({
    description: 'Nome completo do colaborador',
    example: 'Maria Oliveira',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;

  @ApiProperty({
    description: 'CPF do colaborador',
    example: '12345678901',
  })
  @IsString({ message: 'CPF deve ser uma string' })
  cpf: string;

  @ApiProperty({
    description: 'Telefone do colaborador (opcional)',
    example: '(19) 98888-0000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  phone?: string;

  @ApiProperty({
    description: 'Status ativo do colaborador',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;
}

