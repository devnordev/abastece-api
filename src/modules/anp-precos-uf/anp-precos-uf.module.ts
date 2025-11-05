import { Module } from '@nestjs/common';
import { AnpPrecosUfService } from './anp-precos-uf.service';
import { AnpPrecosUfController } from './anp-precos-uf.controller';

@Module({
  controllers: [AnpPrecosUfController],
  providers: [AnpPrecosUfService],
  exports: [AnpPrecosUfService],
})
export class AnpPrecosUfModule {}

