import { Module } from '@nestjs/common';
import { VeiculoService } from './veiculo.service';
import { VeiculoController } from './veiculo.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [VeiculoController],
  providers: [VeiculoService],
  exports: [VeiculoService],
})
export class VeiculoModule {}
