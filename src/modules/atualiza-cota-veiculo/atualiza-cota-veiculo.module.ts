import { Module } from '@nestjs/common';
import { AtualizaCotaVeiculoService } from './atualiza-cota-veiculo.service';
import { AtualizaCotaVeiculoController } from './atualiza-cota-veiculo.controller';

@Module({
  controllers: [AtualizaCotaVeiculoController],
  providers: [AtualizaCotaVeiculoService],
  exports: [AtualizaCotaVeiculoService],
})
export class AtualizaCotaVeiculoModule {}

