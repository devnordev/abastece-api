import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SolicitacaoAbastecimentoService } from './solicitacao-abastecimento.service';

@Injectable()
export class SolicitacaoAbastecimentoSchedulerService {
  private readonly logger = new Logger(SolicitacaoAbastecimentoSchedulerService.name);

  constructor(
    private readonly solicitacaoAbastecimentoService: SolicitacaoAbastecimentoService,
  ) {}

  /**
   * Executa a cada 5 minutos para processar solicitações expiradas
   * Atualiza o status para EXPIRADA e libera os litros de volta para VeiculoCotaPeriodo
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processarSolicitacoesExpiradasAutomaticamente() {
    this.logger.log('Iniciando processamento automático de solicitações expiradas...');
    
    try {
      const resultado = await this.solicitacaoAbastecimentoService.processarSolicitacoesExpiradas();
      
      if (resultado.processadas > 0) {
        this.logger.log(
          `Processadas ${resultado.processadas} solicitação(ões) expirada(s). ` +
          `${resultado.liberadas} tiveram litros liberados de volta para VeiculoCotaPeriodo.`
        );
      }
    } catch (error) {
      this.logger.error('Erro ao processar solicitações expiradas automaticamente:', error);
    }
  }
}

