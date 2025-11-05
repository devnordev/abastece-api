import { Module } from '@nestjs/common';
import { ParametrosTetoService } from './parametros-teto.service';
import { ParametrosTetoController } from './parametros-teto.controller';
import { AnpPrecosUfModule } from '../anp-precos-uf/anp-precos-uf.module';

@Module({
  imports: [AnpPrecosUfModule],
  controllers: [ParametrosTetoController],
  providers: [ParametrosTetoService],
  exports: [ParametrosTetoService],
})
export class ParametrosTetoModule {}

