import { IsString, IsOptional, IsBoolean, IsEnum, IsDecimal, IsInt, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoAbastecimento, StatusAbastecimento } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateAbastecimentoDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: 1,
  })
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId: number;

  @ApiProperty({
    description: 'ID do motorista (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do motorista deve ser um número inteiro' })
  motoristaId?: number;

  @ApiProperty({
    description: 'ID do combustível',
    example: 1,
  })
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  combustivelId: number;

  @ApiProperty({
    description: 'ID da empresa',
    example: 1,
  })
  @IsInt({ message: 'ID da empresa deve ser um número inteiro' })
  empresaId: number;

  @ApiProperty({
    description: 'ID do solicitante (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do solicitante deve ser um número inteiro' })
  solicitanteId?: number;

  @ApiProperty({
    description: 'ID do abastecedor (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do abastecedor deve ser um número inteiro' })
  abastecedorId?: number;

  @ApiProperty({
    description: 'ID do validador (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID do validador deve ser um número inteiro' })
  validadorId?: number;

  @ApiProperty({
    description: 'Tipo de abastecimento',
    enum: TipoAbastecimento,
    example: TipoAbastecimento.COM_COTA,
  })
  @IsEnum(TipoAbastecimento, { message: 'Tipo de abastecimento inválido' })
  tipo_abastecimento: TipoAbastecimento;

  @ApiProperty({
    description: 'Quantidade em litros',
    example: 50.5,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({}, { message: 'Quantidade deve ser um número decimal' })
  quantidade: number;

  @ApiProperty({
    description: 'Preço ANP (opcional)',
    example: 5.50,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({}, { message: 'Preço ANP deve ser um número decimal' })
  preco_anp?: number;

  @ApiProperty({
    description: 'Preço da empresa (opcional)',
    example: 5.45,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({}, { message: 'Preço da empresa deve ser um número decimal' })
  preco_empresa?: number;

  @ApiProperty({
    description: 'Desconto aplicado (opcional)',
    example: 0.05,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({}, { message: 'Desconto deve ser um número decimal' })
  desconto?: number;

  @ApiProperty({
    description: 'Valor total',
    example: 272.50,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({}, { message: 'Valor total deve ser um número decimal' })
  valor_total: number;

  @ApiProperty({
    description: 'Data e hora do abastecimento (opcional)',
    example: '2025-01-15T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'data_abastecimento deve ser uma data válida' })
  data_abastecimento?: string;

  @ApiProperty({
    description: 'Odômetro (opcional)',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Odômetro deve ser um número inteiro' })
  odometro?: number;

  @ApiProperty({
    description: 'Horímetro (opcional)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Horímetro deve ser um número inteiro' })
  orimetro?: number;

  @ApiProperty({
    description: 'Status do abastecimento',
    enum: StatusAbastecimento,
    example: StatusAbastecimento.Aguardando,
    required: false,
  })
  @IsOptional()
  @IsEnum(StatusAbastecimento, { message: 'Status do abastecimento inválido' })
  status?: StatusAbastecimento;

  @ApiProperty({
    description: 'Motivo da rejeição (opcional)',
    example: 'Quantidade excede a cota disponível',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Motivo da rejeição deve ser uma string' })
  motivo_rejeicao?: string;

  @ApiProperty({
    description: 'Quem abasteceu (opcional)',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Abastecido por deve ser uma string' })
  abastecido_por?: string;

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
  @IsInt({ message: 'ID da conta de faturamento deve ser um número inteiro' })
  conta_faturamento_orgao_id?: number;

  @ApiProperty({
    description: 'ID da cota (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da cota deve ser um número inteiro' })
  cota_id?: number;

  @ApiProperty({
    description: 'Se o abastecimento está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;
}
