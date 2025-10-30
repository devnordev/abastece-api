import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteUsuarioDto {
  @ApiProperty({
    description: 'ID do usuário a ser deletado',
    example: 1,
  })
  @IsInt({ message: 'ID deve ser um número inteiro' })
  id: number;
}
