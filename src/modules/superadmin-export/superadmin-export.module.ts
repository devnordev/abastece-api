import { Module } from '@nestjs/common';
import { SuperadminExportController } from './superadmin-export.controller';
import { SuperadminExportService } from './superadmin-export.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuperadminExportController],
  providers: [SuperadminExportService],
  exports: [SuperadminExportService],
})
export class SuperadminExportModule {}
