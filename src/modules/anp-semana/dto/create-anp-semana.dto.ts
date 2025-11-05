import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateAnpSemanaDto {
  @ApiProperty({
    description: 'Data de referência da semana (formato: YYYY-MM-DD)',
    type: String,
    example: '2024-01-15',
  })
  @IsDateString({}, { message: 'Data de referência da semana deve ser uma data válida' })
  semana_ref: string;

  @ApiPropertyOptional({
    description: 'Data de publicação (formato: YYYY-MM-DD ou ISO 8601)',
    type: String,
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de publicação deve ser uma data válida' })
  publicada_em?: string;

  @ApiPropertyOptional({
    description: 'Status ativo da semana ANP',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    type: String,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Data de importação (formato: YYYY-MM-DD ou ISO 8601)',
    type: String,
    example: '2024-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de importação deve ser uma data válida' })
  importado_em?: string;
}

