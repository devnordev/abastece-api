import { IsArray, ArrayMinSize, IsInt, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MotoristaIdDto {
  @ApiProperty({
    description: 'ID do motorista',
    example: 1,
  })
  @IsInt({ message: 'ID do motorista deve ser um número inteiro' })
  @Min(1, { message: 'ID do motorista deve ser maior que zero' })
  idMotorista: number;
}

export class CreateSolicitacaoQrCodeMotoristaDto {
  @ApiProperty({
    description: 'Lista de IDs dos motoristas para solicitar QR Code',
    type: [MotoristaIdDto],
    example: [{ idMotorista: 1 }, { idMotorista: 2 }],
    minItems: 1,
  })
  @IsArray({ message: 'Deve ser um array de motoristas' })
  @ArrayMinSize(1, { message: 'Deve conter pelo menos 1 motorista' })
  @ValidateNested({ each: true })
  @Type(() => MotoristaIdDto)
  motoristas: MotoristaIdDto[];
}

