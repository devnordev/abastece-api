import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaPrecoCombustivelModule } from '../empresa-preco-combustivel/empresa-preco-combustivel.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AbastecimentoModule } from '../abastecimento/abastecimento.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [EmpresaPrecoCombustivelModule, PrismaModule, AbastecimentoModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

