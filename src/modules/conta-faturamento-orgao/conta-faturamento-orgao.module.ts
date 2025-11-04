import { Module } from '@nestjs/common';
import { ContaFaturamentoOrgaoService } from './conta-faturamento-orgao.service';
import { ContaFaturamentoOrgaoController } from './conta-faturamento-orgao.controller';

@Module({
  controllers: [ContaFaturamentoOrgaoController],
  providers: [ContaFaturamentoOrgaoService],
  exports: [ContaFaturamentoOrgaoService],
})
export class ContaFaturamentoOrgaoModule {}

