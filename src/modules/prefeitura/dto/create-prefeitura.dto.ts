import { IsString, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePrefeituraDto {
  @ApiProperty({
    description: 'Nome da prefeitura',
    example: 'Prefeitura Municipal de São Paulo',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'CNPJ da prefeitura',
    example: '12345678000195',
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  cnpj: string;

  @ApiProperty({
    description: 'Email administrativo da prefeitura',
    example: 'admin@prefeitura.sp.gov.br',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email_administrativo: string;

  @ApiProperty({
    description: 'URL da imagem de perfil (opcional)',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Imagem de perfil deve ser uma string' })
  imagem_perfil?: string;

  @ApiProperty({
    description: 'Se a prefeitura requer cupom fiscal',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Requer cupom fiscal deve ser um valor booleano' })
  requer_cupom_fiscal?: boolean;

  @ApiProperty({
    description: 'Se a prefeitura está ativa',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo?: boolean;
}
