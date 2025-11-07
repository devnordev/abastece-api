import { Module } from '@nestjs/common';
import { CotaOrgaoService } from './cota-orgao.service';
import { CotaOrgaoController } from './cota-orgao.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CotaOrgaoController],
  providers: [CotaOrgaoService],
  exports: [CotaOrgaoService],
})
export class CotaOrgaoModule {}

