import { Module } from '@nestjs/common';
import { SolicitacaoAbastecimentoService } from './solicitacao-abastecimento.service';
import { SolicitacaoAbastecimentoController } from './solicitacao-abastecimento.controller';
import { SolicitacaoAbastecimentoSchedulerService } from './solicitacao-abastecimento-scheduler.service';

@Module({
  controllers: [SolicitacaoAbastecimentoController],
  providers: [SolicitacaoAbastecimentoService, SolicitacaoAbastecimentoSchedulerService],
  exports: [SolicitacaoAbastecimentoService],
})
export class SolicitacaoAbastecimentoModule {}

