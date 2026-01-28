import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTelemetriaPrefeituraDto {
  @ApiProperty({
    description: 'ID da organização de telemetria',
    example: 'org_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  organizacaoId: string;

  @ApiProperty({
    description: 'API Key da organização de telemetria',
    example: 'sk_abc123...',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    description: 'ID da API Key (opcional)',
    example: 'key_1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  apiKeyId?: string;
}
