import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidarCapacidadeTanqueDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: 1,
  })
  @IsInt({ message: 'veiculoId deve ser um número inteiro' })
  @IsPositive({ message: 'veiculoId deve ser maior que zero' })
  @Type(() => Number)
  veiculoId: number;

  @ApiProperty({
    description: 'Quantidade de combustível a ser abastecida',
    example: 45.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Quantidade deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Quantidade deve ser maior ou igual a zero' })
  @Type(() => Number)
  quantidade: number;
}

