import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadImageDto {
  @ApiPropertyOptional({
    description: 'Pasta dentro do bucket do Supabase',
    example: 'empresas',
    default: 'uploads',
  })
  @IsOptional()
  @IsString({ message: 'Pasta deve ser uma string' })
  folder?: string;

  @ApiPropertyOptional({
    description: 'Nome do arquivo (sem extensão). Se não fornecido, será gerado automaticamente',
    example: 'empresa-1',
  })
  @IsOptional()
  @IsString({ message: 'Nome do arquivo deve ser uma string' })
  fileName?: string;
}

