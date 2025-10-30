import { Module } from '@nestjs/common';
import { CombustivelService } from './combustivel.service';
import { CombustivelController } from './combustivel.controller';

@Module({
  controllers: [CombustivelController],
  providers: [CombustivelService],
  exports: [CombustivelService],
})
export class CombustivelModule {}
