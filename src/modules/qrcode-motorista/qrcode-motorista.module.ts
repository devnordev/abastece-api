import { Module } from '@nestjs/common';
import { QrCodeMotoristaService } from './qrcode-motorista.service';
import { QrCodeMotoristaController } from './qrcode-motorista.controller';

@Module({
  controllers: [QrCodeMotoristaController],
  providers: [QrCodeMotoristaService],
  exports: [QrCodeMotoristaService],
})
export class QrCodeMotoristaModule {}

