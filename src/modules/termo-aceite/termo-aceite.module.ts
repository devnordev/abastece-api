import { Module } from '@nestjs/common';
import { TermoAceiteService } from './termo-aceite.service';
import { TermoAceiteController } from './termo-aceite.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TermoAceiteController],
  providers: [TermoAceiteService],
  exports: [TermoAceiteService],
})
export class TermoAceiteModule {}
