import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPrecoCombustivelDto {
  @ApiProperty({
    description: 'ID do combustível',
    example: 2,
  })
  @IsInt({ message: 'combustivelId deve ser um inteiro' })
  @IsPositive({ message: 'combustivelId deve ser maior que zero' })
  @Type(() => Number)
  combustivelId: number;

  @ApiProperty({
    description: 'ID da empresa',
    example: 3,
  })
  @IsInt({ message: 'empresaId deve ser um inteiro' })
  @IsPositive({ message: 'empresaId deve ser maior que zero' })
  @Type(() => Number)
  empresaId: number;
}

