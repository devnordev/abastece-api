import { IsInt, IsOptional, IsEnum, IsDateString, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusAbastecimento } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateAbastecimentoFromSolicitacaoAppDto {
  @ApiProperty({
    description: 'ID da solicitação de abastecimento',
    example: 1,
  })
  @IsInt({ message: 'ID da solicitação deve ser um número inteiro' })
  solicitacaoId: number;

  @ApiPropertyOptional({
    description: 'Data do abastecimento (opcional). Se não for enviada, a API usará a data/hora atual do servidor.',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data do abastecimento deve ser uma data válida' })
  data_abastecimento?: string;

  @ApiPropertyOptional({
    description: 'ID do motorista (opcional, sobrescreve o motorista da solicitação se informado)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do motorista deve ser um número inteiro' })
  motoristaId?: number;

  @ApiPropertyOptional({
    description: 'Chave de acesso da NFE (44 dígitos, opcional)',
    example: '12345678901234567890123456789012345678901234',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Chave de acesso da NFE deve ser uma string' })
  nfe_chave_acesso?: string;

  @ApiPropertyOptional({
    description: 'Status do abastecimento',
    enum: StatusAbastecimento,
    example: StatusAbastecimento.Aprovado,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAbastecimento, { message: 'Status do abastecimento inválido' })
  status?: StatusAbastecimento;

  @ApiPropertyOptional({
    description: 'Odômetro (opcional)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Odômetro deve ser um número inteiro' })
  odometro?: number;

  @ApiPropertyOptional({
    description: 'Horímetro (opcional)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Horímetro deve ser um número inteiro' })
  orimetro?: number;

  @ApiPropertyOptional({
    description: 'ID do validador (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do validador deve ser um número inteiro' })
  validadorId?: number;

  @ApiPropertyOptional({
    description: 'ID do abastecedor (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do abastecedor deve ser um número inteiro' })
  abastecedorId?: number;

  @ApiPropertyOptional({
    description: 'Desconto aplicado (opcional)',
    example: 0.05,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  desconto?: number;

  @ApiPropertyOptional({
    description: 'Preço ANP (opcional)',
    example: 5.50,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  preco_anp?: number;

  @ApiPropertyOptional({
    description: 'Quem abasteceu (opcional)',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Abastecido por deve ser uma string' })
  abastecido_por?: string;

  @ApiPropertyOptional({
    description: 'URL da imagem da NFE (opcional, será preenchida automaticamente se nfe_img for enviado)',
    example: 'https://exemplo.com/nfe.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'URL da imagem da NFE deve ser uma string' })
  nfe_img_url?: string;

  @ApiPropertyOptional({
    description: 'Link da NFE (opcional)',
    example: 'https://exemplo.com/nfe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Link da NFE deve ser uma string' })
  nfe_link?: string;

  @ApiPropertyOptional({
    description: 'Observação sobre o abastecimento (opcional)',
    example: 'Abastecimento realizado com sucesso. Veículo em bom estado.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  observacao?: string;

  @ApiPropertyOptional({
    description: 'Se o abastecimento está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;
}

