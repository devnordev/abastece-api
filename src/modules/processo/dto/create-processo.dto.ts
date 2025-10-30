import { IsEnum, IsString, IsOptional, IsInt, IsNumber, IsBoolean, IsDateString, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoContrato, TipoDocumento, TipoItens, StatusProcesso } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateProcessoDto {
  @ApiProperty({
    description: 'Tipo do contrato',
    enum: TipoContrato,
    example: TipoContrato.OBJETIVO
  })
  @IsEnum(TipoContrato, { message: 'Tipo de contrato deve ser OBJETIVO ou CONSORCIADO' })
  @IsNotEmpty({ message: 'Tipo de contrato é obrigatório' })
  tipo_contrato: TipoContrato;

  @ApiPropertyOptional({
    description: 'ID da prefeitura (obrigatório quando tipo_contrato for OBJETIVO)',
    example: 1
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'ID da prefeitura é obrigatório quando o tipo de contrato for OBJETIVO' })
  @IsInt({ message: 'ID da prefeitura deve ser um número inteiro' })
  @Type(() => Number)
  prefeituraId?: number;

  @ApiPropertyOptional({
    description: 'Litros desejados',
    example: 1000.50
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Litros desejados deve ser um número com no máximo 2 casas decimais' })
  @Type(() => Number)
  litros_desejados?: number;

  @ApiPropertyOptional({
    description: 'Valor utilizado',
    example: 5000.00
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor utilizado deve ser um número com no máximo 2 casas decimais' })
  @Type(() => Number)
  valor_utilizado?: number;

  @ApiPropertyOptional({
    description: 'Valor disponível',
    example: 10000.00
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Valor disponível deve ser um número com no máximo 2 casas decimais' })
  @Type(() => Number)
  valor_disponivel?: number;

  @ApiProperty({
    description: 'Número do processo (obrigatório quando tipo_contrato for OBJETIVO)',
    example: 'PROC-2024-001'
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'Número do processo é obrigatório quando o tipo de contrato for OBJETIVO' })
  @IsString({ message: 'Número do processo deve ser uma string' })
  numero_processo: string;

  @ApiProperty({
    description: 'Número do documento (obrigatório quando tipo_contrato for OBJETIVO)',
    example: 'DOC-2024-001'
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'Número do documento é obrigatório quando o tipo de contrato for OBJETIVO' })
  @IsString({ message: 'Número do documento deve ser uma string' })
  numero_documento: string;

  @ApiProperty({
    description: 'Tipo do documento',
    enum: TipoDocumento,
    example: TipoDocumento.LICITACAO
  })
  @IsEnum(TipoDocumento, { message: 'Tipo de documento deve ser LICITACAO, CONTRATO ou ARP' })
  tipo_documento: TipoDocumento;

  @ApiPropertyOptional({
    description: 'Tipo dos itens',
    enum: TipoItens,
    example: TipoItens.QUANTIDADE_LITROS
  })
  @IsOptional()
  @IsEnum(TipoItens, { message: 'Tipo de itens deve ser QUANTIDADE_LITROS' })
  tipo_itens?: TipoItens;

  @ApiProperty({
    description: 'Objeto do processo (obrigatório quando tipo_contrato for OBJETIVO)',
    example: 'Aquisição de combustíveis para frota municipal'
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'Objeto é obrigatório quando o tipo de contrato for OBJETIVO' })
  @IsString({ message: 'Objeto deve ser uma string' })
  objeto: string;

  @ApiProperty({
    description: 'Data de abertura (obrigatória quando tipo_contrato for OBJETIVO)',
    example: '2024-01-15'
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'Data de abertura é obrigatória quando o tipo de contrato for OBJETIVO' })
  @IsDateString({}, { message: 'Data de abertura deve ser uma data válida no formato YYYY-MM-DD ou ISO 8601' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Se for apenas YYYY-MM-DD, adicionar horário para ISO completo
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value + 'T00:00:00.000Z';
      }
    }
    return value;
  })
  data_abertura: Date;

  @ApiPropertyOptional({
    description: 'Data de encerramento (opcional)',
    example: '2024-12-15'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de encerramento deve ser uma data válida no formato YYYY-MM-DD ou ISO 8601' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Se for apenas YYYY-MM-DD, adicionar horário para ISO completo
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value + 'T23:59:59.999Z';
      }
    }
    return value;
  })
  data_encerramento?: Date;

  @ApiPropertyOptional({
    description: 'Status do processo (obrigatório quando tipo_contrato for OBJETIVO)',
    enum: StatusProcesso,
    example: StatusProcesso.ATIVO
  })
  @ValidateIf(o => o.tipo_contrato === TipoContrato.OBJETIVO)
  @IsNotEmpty({ message: 'Status é obrigatório quando o tipo de contrato for OBJETIVO' })
  @IsEnum(StatusProcesso, { message: 'Status deve ser ATIVO, DESATIVADO, EM_ANDAMENTO ou CANCELADO' })
  status?: StatusProcesso;

  @ApiPropertyOptional({
    description: 'Se o processo está ativo',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Observações sobre o processo',
    example: 'Processo para abastecimento da frota 2024'
  })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Caminho do arquivo do contrato',
    example: '/uploads/contratos/contrato-2024-001.pdf'
  })
  @IsOptional()
  @IsString({ message: 'Arquivo do contrato deve ser uma string' })
  arquivo_contrato?: string;
}
