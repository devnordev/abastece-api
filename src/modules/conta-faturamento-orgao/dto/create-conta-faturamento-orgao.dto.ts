import { IsString, IsInt, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateContaFaturamentoOrgaoDto {
  @ApiProperty({
    description: 'ID da prefeitura',
    example: 1,
  })
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  @IsNotEmpty({ message: 'ID da prefeitura é obrigatório' })
  @Type(() => Number)
  prefeituraId: number;

  @ApiProperty({
    description: 'ID do órgão',
    example: 1,
  })
  @IsInt({ message: 'ID do órgão deve ser um número inteiro' })
  @IsNotEmpty({ message: 'ID do órgão é obrigatório' })
  @Type(() => Number)
  orgaoId: number;

  @ApiProperty({
    description: 'Nome da conta de faturamento',
    example: 'Conta de Faturamento - Secretaria de Saúde',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição da conta de faturamento',
    example: 'Conta utilizada para faturamento de abastecimentos da Secretaria de Saúde',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  descricao?: string;
}

