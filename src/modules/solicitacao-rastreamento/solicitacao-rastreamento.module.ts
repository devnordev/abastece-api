import { Module } from '@nestjs/common';
import { SolicitacaoRastreamentoService } from './solicitacao-rastreamento.service';
import { SolicitacaoRastreamentoController } from './solicitacao-rastreamento.controller';

@Module({
  controllers: [SolicitacaoRastreamentoController],
  providers: [SolicitacaoRastreamentoService],
  exports: [SolicitacaoRastreamentoService],
})
export class SolicitacaoRastreamentoModule {}
