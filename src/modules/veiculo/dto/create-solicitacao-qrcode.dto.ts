import { IsArray, ArrayMinSize, IsInt, Min, ValidateNested, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VeiculoIdDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: 1,
  })
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  @Min(1, { message: 'ID do veículo deve ser maior que zero' })
  idVeiculo: number;
}

export class CreateSolicitacaoQrCodeDto {
  @ApiProperty({
    description: 'Lista de IDs dos veículos para solicitar QR Code',
    type: [VeiculoIdDto],
    example: [{ idVeiculo: 1 }, { idVeiculo: 2 }],
    minItems: 1,
  })
  @IsArray({ message: 'Deve ser um array de veículos' })
  @ArrayMinSize(1, { message: 'Deve conter pelo menos 1 veículo' })
  @ValidateNested({ each: true })
  @Type(() => VeiculoIdDto)
  veiculos: VeiculoIdDto[];

  @ApiProperty({
    description: 'Foto do QR Code (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  foto?: string;
}

