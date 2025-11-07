import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber, IsInt, MinLength, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoVeiculo, SituacaoVeiculo, TipoAbastecimentoVeiculo, Periodicidade } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateVeiculoDto {
  @ApiProperty({
    description: 'ID da prefeitura',
    example: 1,
  })
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  prefeituraId: number;

  @ApiProperty({
    description: 'ID do órgão responsável (obrigatório)',
    example: 1,
  })
  @IsInt({ message: 'ID do órgão deve ser um número inteiro' })
  @IsNotEmpty({ message: 'Órgão responsável é obrigatório' })
  orgaoId: number;

  @ApiProperty({
    description: 'ID da conta de faturamento do órgão (opcional)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da conta de faturamento deve ser um número inteiro' })
  contaFaturamentoOrgaoId?: number;

  @ApiProperty({
    description: 'Nome do veículo',
    example: 'Ambulância 01',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC-1234',
  })
  @IsString({ message: 'Placa deve ser uma string' })
  placa: string;

  @ApiProperty({
    description: 'Modelo do veículo (opcional)',
    example: 'Ford Transit',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Modelo deve ser uma string' })
  modelo?: string;

  @ApiProperty({
    description: 'Ano do veículo (opcional)',
    example: 2020,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  ano?: number;

  @ApiProperty({
    description: 'Tipo de abastecimento do veículo (obrigatório)',
    enum: TipoAbastecimentoVeiculo,
    example: TipoAbastecimentoVeiculo.COTA,
  })
  @IsEnum(TipoAbastecimentoVeiculo, { message: 'Tipo de abastecimento inválido' })
  @IsNotEmpty({ message: 'Tipo de abastecimento é obrigatório' })
  tipo_abastecimento: TipoAbastecimentoVeiculo;

  @ApiProperty({
    description: 'Se o veículo está ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'Capacidade do tanque em litros',
    example: 50.5,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Capacidade do tanque deve ser um número' })
  capacidade_tanque: number;

  @ApiProperty({
    description: 'Tipo do veículo',
    enum: TipoVeiculo,
    example: TipoVeiculo.Ambulancia,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoVeiculo, { message: 'Tipo de veículo inválido' })
  tipo_veiculo?: TipoVeiculo;

  @ApiProperty({
    description: 'Situação do veículo',
    enum: SituacaoVeiculo,
    example: SituacaoVeiculo.Proprio,
    required: false,
  })
  @IsOptional()
  @IsEnum(SituacaoVeiculo, { message: 'Situação do veículo inválida' })
  situacao_veiculo?: SituacaoVeiculo;

  @ApiProperty({
    description: 'Observações sobre o veículo (opcional)',
    example: 'Veículo em bom estado',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;

  @ApiProperty({
    description: 'Periodicidade de abastecimento (obrigatório apenas para tipo COTA)',
    enum: Periodicidade,
    example: Periodicidade.Semanal,
    required: false,
  })
  @IsOptional()
  @IsEnum(Periodicidade, { message: 'Periodicidade inválida' })
  periodicidade?: Periodicidade;

  @ApiProperty({
    description: 'Quantidade em litros (obrigatório apenas para tipo COTA)',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  quantidade?: number;

  @ApiProperty({
    description: 'Apelido do veículo (opcional)',
    example: 'Ambulância da Saúde',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Apelido deve ser uma string' })
  apelido?: string;

  @ApiProperty({
    description: 'Ano de fabricação (opcional)',
    example: 2019,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ano de fabricação deve ser um número inteiro' })
  ano_fabricacao?: number;

  @ApiProperty({
    description: 'Chassi do veículo (opcional)',
    example: '9BWZZZZZZZZZZZZZZ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Chassi deve ser uma string' })
  chassi?: string;

  @ApiProperty({
    description: 'RENAVAM do veículo (opcional)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'RENAVAM deve ser uma string' })
  renavam?: string;

  @ApiProperty({
    description: 'CRLV do veículo (opcional)',
    example: 'CRLV123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CRLV deve ser uma string' })
  crlv?: string;

  @ApiProperty({
    description: 'Data de vencimento do CRLV (opcional)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  crlv_vencimento?: Date;

  @ApiProperty({
    description: 'Tacógrafo do veículo (opcional)',
    example: 'TACO123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Tacógrafo deve ser uma string' })
  tacografo?: string;

  @ApiProperty({
    description: 'URL da foto do veículo (opcional)',
    example: 'https://exemplo.com/foto.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Foto do veículo deve ser uma string' })
  foto_veiculo?: string;

  @ApiProperty({
    description: 'URL da foto do CRLV (opcional)',
    example: 'https://exemplo.com/crlv.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Foto do CRLV deve ser uma string' })
  foto_crlv?: string;

  @ApiProperty({
    description: 'Cor do veículo (opcional)',
    example: 'Branco',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cor deve ser uma string' })
  cor?: string;

  @ApiProperty({
    description: 'Capacidade de passageiros (opcional)',
    example: 8,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Capacidade de passageiros deve ser um número inteiro' })
  capacidade_passageiros?: number;

  @ApiProperty({
    description: 'IDs das categorias do veículo (opcional)',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Categorias deve ser um array' })
  @IsInt({ each: true, message: 'Cada categoria deve ser um ID válido' })
  categoriaIds?: number[];

  @ApiProperty({
    description: 'IDs dos combustíveis permitidos para o veículo (obrigatório)',
    example: [1, 2],
  })
  @IsArray({ message: 'Combustíveis deve ser um array' })
  @IsInt({ each: true, message: 'Cada combustível deve ser um ID válido' })
  @IsNotEmpty({ message: 'Pelo menos um combustível deve ser especificado' })
  combustivelIds: number[];

  @ApiProperty({
    description: 'IDs dos motoristas que podem dirigir o veículo (opcional)',
    example: [1, 2],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Motoristas deve ser um array' })
  @IsInt({ each: true, message: 'Cada motorista deve ser um ID válido' })
  motoristaIds?: number[];

  @ApiProperty({
    description: 'Cotas de período para o veículo (opcional)',
    example: [
      {
        data_inicio_periodo: '2024-01-01T00:00:00.000Z',
        data_fim_periodo: '2024-12-31T23:59:59.000Z',
        quantidade_permitida: 1000.0,
        periodicidade: 'Semanal'
      }
    ],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Cotas de período deve ser um array' })
  cotasPeriodo?: Array<{
    data_inicio_periodo: Date;
    data_fim_periodo: Date;
    quantidade_permitida: number;
    periodicidade: string;
  }>;
}
