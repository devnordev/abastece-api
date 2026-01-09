import { Module } from '@nestjs/common';
import { ExportModelService } from './export-model.service';
import { ExportModelController } from './export-model.controller';

@Module({
  controllers: [ExportModelController],
  providers: [ExportModelService],
  exports: [ExportModelService],
})
export class ExportModelModule {}


