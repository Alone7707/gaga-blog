import { Module } from '@nestjs/common';

import { PublicArchiveController } from './public-archive.controller';
import { PublicArchiveService } from './public-archive.service';

@Module({
  controllers: [PublicArchiveController],
  providers: [PublicArchiveService],
})
export class PublicArchiveModule {}
