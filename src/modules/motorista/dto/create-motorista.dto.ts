import { IsString, IsOptional, IsBoolean, IsInt, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMotoristaDto {
  @ApiProperty({
    description: 'ID da prefeitura',
    example: 1,
  })
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId: number;

  @ApiProperty({
    description: 'Nome completo do motorista (obrigatório)',
    example: 'João Silva',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Email do motorista (obrigatório)',
    example: 'joao@exemplo.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'CPF do motorista (obrigatório)',
    example: '12345678901',
  })
  @IsString({ message: 'CPF deve ser uma string' })
  cpf: string;

  @ApiProperty({
    description: 'CNH do motorista (opcional)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CNH deve ser uma string' })
  cnh?: string;

  @ApiProperty({
    description: 'Categoria da CNH (opcional)',
    example: 'B',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Categoria da CNH deve ser uma string' })
  categoria_cnh?: string;

  @ApiProperty({
    description: 'Data de vencimento da CNH (opcional)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  data_vencimento_cnh?: Date;

  @ApiProperty({
    description: 'Telefone do motorista (opcional)',
    example: '11999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @ApiProperty({
    description: 'Endereço do motorista (opcional)',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  endereco?: string;

  @ApiProperty({
    description: 'Se o motorista está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'Observações sobre o motorista (opcional)',
    example: 'Motorista experiente',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;
}
