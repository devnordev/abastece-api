import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaPrecoCombustivelModule } from '../empresa-preco-combustivel/empresa-preco-combustivel.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [EmpresaPrecoCombustivelModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

