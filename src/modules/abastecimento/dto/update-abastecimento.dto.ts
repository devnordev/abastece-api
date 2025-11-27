import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateAbastecimentoDto {
  @ApiProperty({
    description: 'Quantidade em litros (opcional) - aceita números inteiros (ex: 10) ou decimais (ex: 10.5)',
    example: 50.5,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    // Converte vírgula para ponto se necessário
    const stringValue = String(value).replace(',', '.');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? value : parsed;
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número (ex: 10 ou 10.5)' })
  quantidade?: number;

  @ApiProperty({
    description: 'Observação sobre o abastecimento (opcional)',
    example: 'Abastecimento realizado com sucesso. Veículo em bom estado.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  observacao?: string;

  @ApiProperty({
    description: 'Link da NFE (opcional)',
    example: 'https://exemplo.com/nfe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Link da NFE deve ser uma string' })
  nfe_link?: string;

  @ApiProperty({
    description: 'URL da imagem da NFE (opcional)',
    example: 'https://exemplo.com/nfe.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'URL da imagem da NFE deve ser uma string' })
  nfe_img_url?: string;
}
