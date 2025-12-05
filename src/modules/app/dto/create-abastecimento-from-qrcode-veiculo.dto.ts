import { IsInt, IsNumber, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { TipoAbastecimento } from '@prisma/client';

export class CreateAbastecimentoFromQrCodeVeiculoAppDto {
  @ApiProperty({
    description: 'ID do veículo (obtido através do QR code)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId: number;

  @ApiProperty({
    description: 'ID do combustível',
    example: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  combustivelId: number;

  @ApiProperty({
    description: 'Tipo de abastecimento',
    enum: TipoAbastecimento,
    example: TipoAbastecimento.LIVRE,
  })
  @IsEnum(TipoAbastecimento, { message: 'Tipo de abastecimento inválido' })
  tipo_abastecimento: TipoAbastecimento;

  @ApiProperty({
    description: 'Quantidade em litros',
    example: 50.5,
  })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber({}, { message: 'Quantidade deve ser um número decimal' })
  quantidade: number;

  @ApiProperty({
    description: 'Preço ANP (opcional)',
    example: 5.50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value !== undefined && value !== null ? (typeof value === 'string' ? parseFloat(value) : value) : value)
  @IsNumber({}, { message: 'Preço ANP deve ser um número decimal' })
  preco_anp?: number;

  @ApiProperty({
    description: 'Preço da empresa (opcional)',
    example: 5.45,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value !== undefined && value !== null ? (typeof value === 'string' ? parseFloat(value) : value) : value)
  @IsNumber({}, { message: 'Preço da empresa deve ser um número decimal' })
  preco_empresa?: number;

  @ApiProperty({
    description: 'Desconto aplicado (opcional)',
    example: 0.05,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => value !== undefined && value !== null ? (typeof value === 'string' ? parseFloat(value) : value) : value)
  @IsNumber({}, { message: 'Desconto deve ser um número decimal' })
  desconto?: number;

  @ApiProperty({
    description: 'Valor total',
    example: 272.50,
  })
  @Type(() => Number)
  @Transform(({ value }) => (typeof value === 'string' ? parseFloat(value) : value))
  @IsNumber({}, { message: 'Valor total deve ser um número decimal' })
  valor_total: number;

  @ApiProperty({
    description: 'Odômetro (opcional)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Odômetro deve ser um número inteiro' })
  odometro?: number;

  @ApiProperty({
    description: 'Horímetro (opcional)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Horímetro deve ser um número inteiro' })
  orimetro?: number;

  @ApiProperty({
    description: 'Chave de acesso da NFE (opcional)',
    example: '12345678901234567890123456789012345678901234',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Chave de acesso da NFE deve ser uma string' })
  nfe_chave_acesso?: string;

  @ApiProperty({
    description: 'URL da imagem da NFE (opcional)',
    example: 'https://exemplo.com/nfe.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'URL da imagem da NFE deve ser uma string' })
  nfe_img_url?: string;

  @ApiProperty({
    description: 'Link da NFE (opcional)',
    example: 'https://exemplo.com/nfe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Link da NFE deve ser uma string' })
  nfe_link?: string;

  @ApiProperty({
    description: 'Observação sobre o abastecimento (opcional)',
    example: 'Abastecimento realizado com sucesso. Veículo em bom estado.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  observacao?: string;

  @ApiProperty({
    description: 'ID da conta de faturamento do órgão (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da conta de faturamento deve ser um número inteiro' })
  conta_faturamento_orgao_id?: number;

  @ApiProperty({
    description: 'ID da empresa',
    example: 5,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId: number;

  @ApiProperty({
    description: 'ID do motorista',
    example: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID do motorista deve ser um número inteiro' })
  motoristaId: number;
}

