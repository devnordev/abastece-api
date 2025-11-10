import { Module } from '@nestjs/common';
import { SolicitacaoAbastecimentoService } from './solicitacao-abastecimento.service';
import { SolicitacaoAbastecimentoController } from './solicitacao-abastecimento.controller';

@Module({
  controllers: [SolicitacaoAbastecimentoController],
  providers: [SolicitacaoAbastecimentoService],
  exports: [SolicitacaoAbastecimentoService],
})
export class SolicitacaoAbastecimentoModule {}

