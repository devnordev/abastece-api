import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StatusSolicitacao, TipoAbastecimentoSolicitacao } from '@prisma/client';

export class CreateSolicitacaoAbastecimentoDto {
  @ApiProperty({ description: 'ID da prefeitura relacionada', example: 1 })
  @IsInt({ message: 'prefeituraId deve ser um inteiro' })
  @Type(() => Number)
  prefeituraId: number;

  @ApiProperty({ description: 'ID do veículo', example: 10 })
  @IsInt({ message: 'veiculoId deve ser um inteiro' })
  @Type(() => Number)
  veiculoId: number;

  @ApiPropertyOptional({ description: 'ID do motorista (opcional)', example: 5 })
  @IsOptional()
  @IsInt({ message: 'motoristaId deve ser um inteiro' })
  @Type(() => Number)
  motoristaId?: number;

  @ApiProperty({ description: 'ID do combustível', example: 2 })
  @IsInt({ message: 'combustivelId deve ser um inteiro' })
  @Type(() => Number)
  combustivelId: number;

  @ApiProperty({ description: 'ID da empresa', example: 3 })
  @IsInt({ message: 'empresaId deve ser um inteiro' })
  @Type(() => Number)
  empresaId: number;

  @ApiProperty({ description: 'Quantidade solicitada', example: 120.5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'quantidade deve ser um número com até 2 casas decimais' })
  @IsPositive({ message: 'quantidade deve ser positiva' })
  @Type(() => Number)
  quantidade: number;

  @ApiProperty({ description: 'Data da solicitação', example: '2025-01-15T12:00:00Z' })
  @IsDateString({}, { message: 'data_solicitacao deve ser uma data válida' })
  data_solicitacao: string;

  @ApiProperty({ description: 'Data de expiração', example: '2025-02-15T12:00:00Z' })
  @IsDateString({}, { message: 'data_expiracao deve ser uma data válida' })
  data_expiracao: string;

  @ApiProperty({
    description: 'Tipo de abastecimento da solicitação',
    enum: TipoAbastecimentoSolicitacao,
    example: TipoAbastecimentoSolicitacao.COM_COTA,
  })
  @IsEnum(TipoAbastecimentoSolicitacao, { message: 'tipo_abastecimento inválido' })
  tipo_abastecimento: TipoAbastecimentoSolicitacao;

  @ApiPropertyOptional({ description: 'Status da solicitação', enum: StatusSolicitacao })
  @IsOptional()
  @IsEnum(StatusSolicitacao, { message: 'status inválido' })
  status?: StatusSolicitacao;

  @ApiPropertyOptional({ description: 'Chave de acesso da NFe', example: '12345678901234567890123456789012345678901234' })
  @IsOptional()
  @IsString({ message: 'nfe_chave_acesso deve ser uma string' })
  @MaxLength(44, { message: 'nfe_chave_acesso deve ter no máximo 44 caracteres' })
  nfe_chave_acesso?: string;

  @ApiPropertyOptional({ description: 'URL da imagem da NFe', example: 'https://exemplo.com/nfe.jpg' })
  @IsOptional()
  @IsString({ message: 'nfe_img_url deve ser uma string' })
  nfe_img_url?: string;

  @ApiPropertyOptional({ description: 'Motivo da rejeição', example: 'Documentos inválidos' })
  @IsOptional()
  @IsString({ message: 'motivo_rejeicao deve ser uma string' })
  motivo_rejeicao?: string;

  @ApiPropertyOptional({ description: 'Nome de quem aprovou', example: 'João Silva' })
  @IsOptional()
  @IsString({ message: 'aprovado_por deve ser uma string' })
  aprovado_por?: string;

  @ApiPropertyOptional({ description: 'Email de quem aprovou', example: 'joao@empresa.com' })
  @IsOptional()
  @IsString({ message: 'aprovado_por_email deve ser uma string' })
  aprovado_por_email?: string;

  @ApiPropertyOptional({ description: 'Empresa de quem aprovou', example: 'Empresa X' })
  @IsOptional()
  @IsString({ message: 'aprovado_por_empresa deve ser uma string' })
  aprovado_por_empresa?: string;

  @ApiPropertyOptional({ description: 'Data da aprovação', example: '2025-01-20T10:30:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'data_aprovacao deve ser uma data válida' })
  data_aprovacao?: string;

  @ApiPropertyOptional({ description: 'Nome de quem rejeitou', example: 'Maria Oliveira' })
  @IsOptional()
  @IsString({ message: 'rejeitado_por deve ser uma string' })
  rejeitado_por?: string;

  @ApiPropertyOptional({ description: 'Email de quem rejeitou', example: 'maria@empresa.com' })
  @IsOptional()
  @IsString({ message: 'rejeitado_por_email deve ser uma string' })
  rejeitado_por_email?: string;

  @ApiPropertyOptional({ description: 'Empresa de quem rejeitou', example: 'Empresa Y' })
  @IsOptional()
  @IsString({ message: 'rejeitado_por_empresa deve ser uma string' })
  rejeitado_por_empresa?: string;

  @ApiPropertyOptional({ description: 'Data da rejeição', example: '2025-01-25T09:15:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'data_rejeicao deve ser uma data válida' })
  data_rejeicao?: string;

  @ApiPropertyOptional({ description: 'ID da conta de faturamento do órgão', example: 7 })
  @IsOptional()
  @IsInt({ message: 'conta_faturamento_orgao_id deve ser um inteiro' })
  @Type(() => Number)
  conta_faturamento_orgao_id?: number;

  @ApiPropertyOptional({ description: 'Nome de quem abasteceu', example: 'Sistema' })
  @IsOptional()
  @IsString({ message: 'abastecido_por deve ser uma string' })
  abastecido_por?: string;

  @ApiPropertyOptional({ description: 'Valor total', example: 1230.75 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_total deve possuir no máximo 2 casas decimais' })
  @Type(() => Number)
  valor_total?: number;

  @ApiPropertyOptional({ description: 'Preço praticado pela empresa', example: 5.19 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'preco_empresa deve possuir no máximo 2 casas decimais' })
  @Type(() => Number)
  preco_empresa?: number;

  @ApiPropertyOptional({ description: 'ID do abastecimento gerado', example: 12 })
  @IsOptional()
  @IsInt({ message: 'abastecimento_id deve ser um inteiro' })
  @Type(() => Number)
  abastecimento_id?: number;

  @ApiPropertyOptional({ description: 'Se a solicitação está ativa', example: true, default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 'true';
  })
  @IsBoolean({ message: 'ativo deve ser um valor booleano' })
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Observações adicionais', example: 'Urgente' })
  @IsOptional()
  @IsString({ message: 'observacoes deve ser uma string' })
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Comentário interno da prefeitura (não visível para empresa)', example: 'Comentário interno' })
  @IsOptional()
  @IsString({ message: 'comentario_prefeitura deve ser uma string' })
  comentario_prefeitura?: string;
}

