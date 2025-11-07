import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePrecoAtualDto {
  @ApiProperty({
    description: 'ID do combustível',
    example: 1,
  })
  @IsInt({ message: 'ID do combustível deve ser um número inteiro' })
  @Type(() => Number)
  combustivel_id: number;

  @ApiProperty({
    description: 'Preço atual do combustível',
    example: 5.89,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Preço atual deve ser um número com no máximo 2 casas decimais' })
  @Min(0, { message: 'Preço atual deve ser maior ou igual a 0' })
  @Type(() => Number)
  preco_atual: number;
}

