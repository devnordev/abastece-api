import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusSolicitacao } from '@prisma/client';

export class UpdateStatusSolicitacaoDto {
  @ApiProperty({
    description: 'Novo status da solicitação',
    enum: StatusSolicitacao,
    example: StatusSolicitacao.APROVADA,
  })
  @IsEnum(StatusSolicitacao, { message: 'status inválido' })
  status: StatusSolicitacao;

  @ApiProperty({
    description: 'Motivo da rejeição (obrigatório quando status for REJEITADA)',
    example: 'Quantidade excede o limite disponível',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'motivo_rejeicao deve ser uma string' })
  motivo_rejeicao?: string;

  @ApiProperty({
    description: 'Nome de quem está aprovando (quando status for APROVADA)',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'aprovado_por deve ser uma string' })
  aprovado_por?: string;

  @ApiProperty({
    description: 'Email de quem está aprovando (quando status for APROVADA)',
    example: 'joao.silva@prefeitura.gov.br',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'aprovado_por_email deve ser uma string' })
  aprovado_por_email?: string;

  @ApiProperty({
    description: 'Empresa de quem está aprovando (quando status for APROVADA)',
    example: 'Empresa XYZ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'aprovado_por_empresa deve ser uma string' })
  aprovado_por_empresa?: string;

  @ApiProperty({
    description: 'Nome de quem está rejeitando (quando status for REJEITADA)',
    example: 'Maria Santos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'rejeitado_por deve ser uma string' })
  rejeitado_por?: string;

  @ApiProperty({
    description: 'Email de quem está rejeitando (quando status for REJEITADA)',
    example: 'maria.santos@prefeitura.gov.br',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'rejeitado_por_email deve ser uma string' })
  rejeitado_por_email?: string;

  @ApiProperty({
    description: 'Empresa de quem está rejeitando (quando status for REJEITADA)',
    example: 'Empresa ABC',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'rejeitado_por_empresa deve ser uma string' })
  rejeitado_por_empresa?: string;
}

