import { Module } from '@nestjs/common';
import { ProcessoService } from './processo.service';
import { ProcessoController } from './processo.controller';
import { TransformProcessoCombustiveisPipe } from './pipes/transform-processo-combustiveis.pipe';

@Module({
  controllers: [ProcessoController],
  providers: [ProcessoService, TransformProcessoCombustiveisPipe],
  exports: [ProcessoService],
})
export class ProcessoModule {}
