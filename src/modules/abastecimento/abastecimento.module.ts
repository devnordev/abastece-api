import { Module } from '@nestjs/common';
import { AbastecimentoService } from './abastecimento.service';
import { AbastecimentoController } from './abastecimento.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AbastecimentoController],
  providers: [AbastecimentoService],
  exports: [AbastecimentoService],
})
export class AbastecimentoModule {}
