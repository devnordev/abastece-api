import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetSenhaColaboradorEmpresaDto {
  @ApiProperty({
    description: 'Nova senha do colaborador',
    example: 'NovaSenha123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  novaSenha: string;
}

