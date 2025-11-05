import { Module } from '@nestjs/common';
import { AnpSemanaService } from './anp-semana.service';
import { AnpSemanaController } from './anp-semana.controller';

@Module({
  controllers: [AnpSemanaController],
  providers: [AnpSemanaService],
  exports: [AnpSemanaService],
})
export class AnpSemanaModule {}

