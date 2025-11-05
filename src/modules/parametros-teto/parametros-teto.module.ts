import { Module } from '@nestjs/common';
import { ParametrosTetoService } from './parametros-teto.service';
import { ParametrosTetoController } from './parametros-teto.controller';

@Module({
  controllers: [ParametrosTetoController],
  providers: [ParametrosTetoService],
  exports: [ParametrosTetoService],
})
export class ParametrosTetoModule {}

