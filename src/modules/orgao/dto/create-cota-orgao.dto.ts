import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCotaOrgaoDto {
  @ApiProperty({
    description: 'ID do processo objetivo ao qual a cota estará vinculada',
    example: 1,
  })
  @IsInt({ message: 'processoId deve ser um número inteiro' })
  @Type(() => Number)
  processoId: number;

  @ApiProperty({
    description: 'ID do combustível vinculado à cota',
    example: 3,
  })
  @IsInt({ message: 'combustivelId deve ser um número inteiro' })
  @Type(() => Number)
  combustivelId: number;

  @ApiProperty({
    description: 'Quantidade de litros da cota para este órgão e combustível',
    example: 10000.0,
  })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'quantidade deve ser numérica, com até 3 casas decimais' })
  @Min(0.001, { message: 'quantidade deve ser maior que zero' })
  @Type(() => Number)
  quantidade: number;
}


