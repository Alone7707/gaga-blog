import { Module } from '@nestjs/common';

import { SettingModule } from '../setting/setting.module';
import { PublicArchiveController } from './public-archive.controller';
import { PublicArchiveService } from './public-archive.service';

@Module({
  imports: [SettingModule],
  controllers: [PublicArchiveController],
  providers: [PublicArchiveService],
})
export class PublicArchiveModule {}
