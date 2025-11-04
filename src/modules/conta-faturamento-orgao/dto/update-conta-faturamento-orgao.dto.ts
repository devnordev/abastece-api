import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateContaFaturamentoOrgaoDto } from './create-conta-faturamento-orgao.dto';

export class UpdateContaFaturamentoOrgaoDto extends PartialType(
  OmitType(CreateContaFaturamentoOrgaoDto, ['prefeituraId', 'orgaoId'] as const)
) {
  // Ao atualizar, não permitimos alterar prefeituraId e orgaoId
}

