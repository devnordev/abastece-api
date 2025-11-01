import { Module } from '@nestjs/common';
import { PrefeituraService } from './prefeitura.service';
import { PrefeituraController } from './prefeitura.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [PrefeituraController],
  providers: [PrefeituraService],
  exports: [PrefeituraService],
})
export class PrefeituraModule {}
