import { IsNumber, IsPositive, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCotaOrgaoDto {
  @ApiProperty({
    description: 'Quantidade de combustível em litros',
    example: 1000.0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @IsPositive({ message: 'Quantidade deve ser positiva' })
  quantidade?: number;

  @ApiProperty({
    description: 'Status ativo da cota',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativa deve ser um valor booleano' })
  ativa?: boolean;
}

