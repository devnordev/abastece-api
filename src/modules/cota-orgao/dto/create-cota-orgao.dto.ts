import { IsInt, IsNumber, IsPositive, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCotaOrgaoDto {
  @ApiProperty({
    description: 'ID do processo',
    example: 1,
  })
  @IsInt({ message: 'ID do processo deve ser um número inteiro' })
  @IsPositive({ message: 'ID do processo deve ser positivo' })
  processoId: number;

  @ApiProperty({
    description: 'ID do órgão',
    example: 1,
  })
  @IsInt({ message: 'ID do órgão deve ser um número inteiro' })
  @IsPositive({ message: 'ID do órgão deve ser positivo' })
  orgaoId: number;

  @ApiProperty({
    description: 'ID do combustível',
    example: 1,
  })
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  @IsPositive({ message: 'ID do combustível deve ser positivo' })
  combustivelId: number;

  @ApiProperty({
    description: 'Quantidade de combustível em litros',
    example: 1000.0,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @IsPositive({ message: 'Quantidade deve ser positiva' })
  quantidade: number;

  @ApiProperty({
    description: 'Status ativo da cota',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativa deve ser um valor booleano' })
  ativa?: boolean;
}

