import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedefinirSenhaDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAtual123',
    minLength: 6,
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @MinLength(6, { message: 'Senha atual deve ter pelo menos 6 caracteres' })
  senha_atual: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenha123',
    minLength: 6,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'Nova senha deve ter pelo menos 6 caracteres' })
  nova_senha: string;

  @ApiProperty({
    description: 'Confirmação da nova senha (deve ser igual à nova senha)',
    example: 'NovaSenha123',
    minLength: 6,
  })
  @IsString({ message: 'Confirmar senha deve ser uma string' })
  @MinLength(6, { message: 'Confirmar senha deve ter pelo menos 6 caracteres' })
  confirmar_senha: string;
}

