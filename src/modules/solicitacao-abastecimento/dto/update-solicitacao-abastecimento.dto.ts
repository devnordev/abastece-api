import { PartialType } from '@nestjs/swagger';
import { CreateSolicitacaoAbastecimentoDto } from './create-solicitacao-abastecimento.dto';

export class UpdateSolicitacaoAbastecimentoDto extends PartialType(CreateSolicitacaoAbastecimentoDto) {}

