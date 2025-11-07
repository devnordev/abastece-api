import { Module } from '@nestjs/common';
import { EmpresaPrecoCombustivelService } from './empresa-preco-combustivel.service';
import { EmpresaPrecoCombustivelController } from './empresa-preco-combustivel.controller';

@Module({
  controllers: [EmpresaPrecoCombustivelController],
  providers: [EmpresaPrecoCombustivelService],
  exports: [EmpresaPrecoCombustivelService],
})
export class EmpresaPrecoCombustivelModule {}

