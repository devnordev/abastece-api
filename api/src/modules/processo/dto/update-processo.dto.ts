import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProcessoDto } from './create-processo.dto';

export class UpdateProcessoDto extends PartialType(
  OmitType(CreateProcessoDto, [
    'tipo_contrato', 
    'prefeituraId', 
    'numero_processo', 
    'numero_documento', 
    'tipo_documento',
    'data_abertura'
  ] as const)
) {
  // Ao atualizar, não permitimos alterar campos chave como tipo_contrato, 
  // prefeituraId, numero_processo, numero_documento, tipo_documento e data_abertura
}
