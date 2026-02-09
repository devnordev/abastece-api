import { Module } from '@nestjs/common';
import { ConfiguracaoAlertaService } from './configuracao-alerta.service';
import { ConfiguracaoAlertaController } from './configuracao-alerta.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracaoAlertaController],
  providers: [ConfiguracaoAlertaService],
  exports: [ConfiguracaoAlertaService],
})
export class ConfiguracaoAlertaModule {}

