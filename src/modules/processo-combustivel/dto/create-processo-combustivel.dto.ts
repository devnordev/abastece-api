import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProcessoCombustivelDto {
  @ApiProperty({ description: 'ID do processo', example: 1 })
  @IsInt({ message: 'processoId deve ser um número inteiro' })
  @Type(() => Number)
  processoId: number;

  @ApiProperty({ description: 'ID do combustível', example: 1 })
  @IsInt({ message: 'combustivelId deve ser um número inteiro' })
  @Type(() => Number)
  combustivelId: number;

  @ApiProperty({ description: 'Quantidade de litros', example: 1000.50 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'quantidade_litros deve ser um número com até 2 casas decimais' })
  @IsPositive({ message: 'quantidade_litros deve ser um número positivo' })
  @Type(() => Number)
  quantidade_litros: number;

  @ApiPropertyOptional({ description: 'Valor unitário', example: 5.50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'valor_unitario deve ser um número com até 2 casas decimais' })
  @Min(0, { message: 'valor_unitario deve ser maior ou igual a zero' })
  @Type(() => Number)
  valor_unitario?: number;

  @ApiPropertyOptional({ description: 'Saldo bloqueado do processo', example: 100.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'saldo_bloqueado_processo deve ser um número com até 2 casas decimais' })
  @Min(0, { message: 'saldo_bloqueado_processo deve ser maior ou igual a zero' })
  @Type(() => Number)
  saldo_bloqueado_processo?: number;

  @ApiPropertyOptional({ description: 'Saldo disponível do processo', example: 900.50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'saldo_disponivel_processo deve ser um número com até 2 casas decimais' })
  @Min(0, { message: 'saldo_disponivel_processo deve ser maior ou igual a zero' })
  @Type(() => Number)
  saldo_disponivel_processo?: number;
}

