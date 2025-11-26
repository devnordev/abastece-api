import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPrecoEmpresaCombustivelDto {
  @ApiProperty({
    description: 'ID da empresa',
    example: 1,
    required: true,
  })
  @IsInt({ message: 'empresaId deve ser um número inteiro' })
  @IsNotEmpty({ message: 'empresaId é obrigatório' })
  @Type(() => Number)
  empresaId: number;

  @ApiProperty({
    description: 'ID do combustível',
    example: 1,
    required: true,
  })
  @IsInt({ message: 'combustivelId deve ser um número inteiro' })
  @IsNotEmpty({ message: 'combustivelId é obrigatório' })
  @Type(() => Number)
  combustivelId: number;
}

