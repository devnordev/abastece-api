import { Module } from '@nestjs/common';
import { ProcessoCombustivelService } from './processo-combustivel.service';
import { ProcessoCombustivelController } from './processo-combustivel.controller';

@Module({
  controllers: [ProcessoCombustivelController],
  providers: [ProcessoCombustivelService],
  exports: [ProcessoCombustivelService],
})
export class ProcessoCombustivelModule {}

