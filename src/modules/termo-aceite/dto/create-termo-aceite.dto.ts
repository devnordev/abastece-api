import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTermoAceiteDto {
  @ApiProperty({
    description: 'Versão do termo aceito',
    example: '1.0',
    default: '1.0',
  })
  @IsString()
  @IsOptional()
  versao?: string;

  @ApiProperty({
    description: 'Indica se o usuário aceitou o termo',
    example: true,
  })
  @IsBoolean()
  aceito: boolean;

  @ApiPropertyOptional({
    description: 'Endereço IP do usuário',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'User agent do navegador/app',
    example: 'Mozilla/5.0...',
  })
  @IsString()
  @IsOptional()
  user_agent?: string;

  @ApiPropertyOptional({
    description: 'Plataforma onde o termo foi aceito',
    example: 'web',
    enum: ['web', 'app'],
  })
  @IsString()
  @IsOptional()
  plataforma?: string;
}
