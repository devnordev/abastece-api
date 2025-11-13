import { Module } from '@nestjs/common';
import { SolicitacoesQrCodeVeiculoService } from './solicitacoes-qrcode-veiculo.service';
import { SolicitacoesQrCodeVeiculoController } from './solicitacoes-qrcode-veiculo.controller';

@Module({
  controllers: [SolicitacoesQrCodeVeiculoController],
  providers: [SolicitacoesQrCodeVeiculoService],
  exports: [SolicitacoesQrCodeVeiculoService],
})
export class SolicitacoesQrCodeVeiculoModule {}

