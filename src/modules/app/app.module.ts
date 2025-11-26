import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EmpresaPrecoCombustivelModule } from '../empresa-preco-combustivel/empresa-preco-combustivel.module';

@Module({
  imports: [EmpresaPrecoCombustivelModule],
  controllers: [AppController],
})
export class AppModule {}

