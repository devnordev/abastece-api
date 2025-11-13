import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusQrCodeMotorista } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Novo status da solicitação',
    enum: StatusQrCodeMotorista,
    enumName: 'StatusQrCodeMotorista',
    example: StatusQrCodeMotorista.Aprovado,
  })
  @IsEnum(StatusQrCodeMotorista, {
    message: 'Status inválido. Valores permitidos: Solicitado, Aprovado, Em_Producao, Integracao, Concluida, Inativo, Cancelado',
  })
  status: StatusQrCodeMotorista;

  @ApiProperty({
    description: 'Motivo do cancelamento (obrigatório apenas quando status é Cancelado)',
    required: false,
    example: 'Solicitação cancelada pelo usuário',
  })
  @IsOptional()
  @IsString({ message: 'Motivo do cancelamento deve ser uma string' })
  motivoCancelamento?: string;
}

