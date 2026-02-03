import { ApiProperty } from '@nestjs/swagger';

export class TermoAceiteResponseDto {
  @ApiProperty({ description: 'ID do registro de aceite' })
  id: number;

  @ApiProperty({ description: 'ID do usuário' })
  usuarioId: number;

  @ApiProperty({ description: 'Versão do termo', example: '1.0' })
  versao: string;

  @ApiProperty({ description: 'Indica se o termo foi aceito' })
  aceito: boolean;

  @ApiProperty({ description: 'Data do aceite', nullable: true })
  data_aceite: Date | null;

  @ApiProperty({ description: 'Plataforma onde foi aceito', nullable: true })
  plataforma: string | null;

  @ApiProperty({ description: 'Data de criação' })
  created_date: Date;

  @ApiProperty({ description: 'Data de atualização' })
  modified_date: Date;
}

export class VerificarAceiteResponseDto {
  @ApiProperty({ description: 'Indica se o usuário já aceitou o termo' })
  aceito: boolean;

  @ApiProperty({ description: 'Versão do termo verificado', example: '1.0' })
  versao: string;

  @ApiProperty({ description: 'Data do aceite', nullable: true })
  data_aceite: Date | null;

  @ApiProperty({ description: 'Dados completos do aceite', nullable: true })
  termoAceite: TermoAceiteResponseDto | null;
}
