import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportarCsvDto {
  @ApiProperty({
    description: 'ID da semana ANP de referência',
    type: Number,
    example: 1,
  })
  @IsInt({ message: 'anp_semana_id deve ser um número inteiro' })
  @Min(1, { message: 'anp_semana_id deve ser maior que 0' })
  @Type(() => Number)
  anp_semana_id: number;
}

