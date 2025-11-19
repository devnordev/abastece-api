import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsNumber, IsInt, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UF, TipoEmpresa } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateEmpresaDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Posto Shell',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'CNPJ da empresa',
    example: '12345678000195',
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  cnpj: string;

  @ApiProperty({
    description: 'UF da empresa',
    enum: UF,
    example: UF.SP,
  })
  @IsEnum(UF, { message: 'UF inválida' })
  uf: UF;

  @ApiProperty({
    description: 'Endereço da empresa (opcional)',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  endereco?: string;

  @ApiProperty({
    description: 'Cidade da empresa (opcional)',
    example: 'São Paulo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  cidade?: string;

  @ApiProperty({
    description: 'Contato da empresa (opcional)',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Contato deve ser uma string' })
  contato?: string;

  @ApiProperty({
    description: 'Se a empresa está ativa',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiProperty({
    description: 'URL da imagem de perfil (opcional)',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Imagem de perfil deve ser uma string' })
  imagem_perfil?: string;

  @ApiProperty({
    description: 'Se a empresa é pública',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'IsPublic deve ser um valor booleano' })
  isPublic?: boolean;

  @ApiProperty({
    description: 'Tipo da empresa',
    enum: TipoEmpresa,
    example: TipoEmpresa.POSTO_GASOLINA,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoEmpresa, { message: 'Tipo de empresa inválido' })
  tipo_empresa?: TipoEmpresa;

  @ApiProperty({
    description: 'Latitude da empresa (opcional)',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  latitude?: number;

  @ApiProperty({
    description: 'Longitude da empresa (opcional)',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  longitude?: number;

  @ApiProperty({
    description: 'Endereço completo da empresa (opcional)',
    example: 'Rua das Flores, 123, Centro, São Paulo - SP',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Endereço completo deve ser uma string' })
  endereco_completo?: string;

  @ApiProperty({
    description: 'Horário de funcionamento (opcional)',
    example: '24h',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Horário de funcionamento deve ser uma string' })
  horario_funcionamento?: string;

  @ApiProperty({
    description: 'Telefone da empresa (opcional)',
    example: '11999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @ApiProperty({
    description: 'Email da empresa (opcional)',
    example: 'contato@posto.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email?: string;

  @ApiProperty({
    description: 'Website da empresa (opcional)',
    example: 'https://www.posto.com',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Website deve ser uma string' })
  website?: string;

  @ApiProperty({
    description: 'Bandeira da empresa (opcional)',
    example: 'Shell',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bandeira deve ser uma string' })
  bandeira?: string;

  @ApiProperty({
    description: 'Serviços disponíveis (opcional)',
    example: 'Abastecimento, Lavagem, Conveniência',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Serviços disponíveis deve ser uma string' })
  servicos_disponiveis?: string;

  @ApiProperty({
    description: 'Formas de pagamento (opcional)',
    example: 'Dinheiro, Cartão, PIX',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Formas de pagamento deve ser uma string' })
  formas_pagamento?: string;

  @ApiProperty({
    description: 'Avaliação da empresa (opcional)',
    example: 4.5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Avaliação deve ser um número' })
  avaliacao?: number;

  @ApiProperty({
    description: 'Total de avaliações (opcional)',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Total de avaliações deve ser um número inteiro' })
  total_avaliacoes?: number;
}
