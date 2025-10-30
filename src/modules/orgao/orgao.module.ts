import { Module } from '@nestjs/common';
import { OrgaoService } from './orgao.service';
import { OrgaoController } from './orgao.controller';

@Module({
  controllers: [OrgaoController],
  providers: [OrgaoService],
  exports: [OrgaoService],
})
export class OrgaoModule {}
