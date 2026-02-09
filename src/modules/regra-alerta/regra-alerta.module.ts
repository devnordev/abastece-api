import { Module } from '@nestjs/common';
import { RegraAlertaService } from './regra-alerta.service';
import { RegraAlertaController } from './regra-alerta.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegraAlertaController],
  providers: [RegraAlertaService],
  exports: [RegraAlertaService],
})
export class RegraAlertaModule {}

