import { Module } from '@nestjs/common';
import { PrefeituraService } from './prefeitura.service';
import { PrefeituraController } from './prefeitura.controller';

@Module({
  controllers: [PrefeituraController],
  providers: [PrefeituraService],
  exports: [PrefeituraService],
})
export class PrefeituraModule {}
