import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { PublicSiteController } from './public-site.controller';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingController, PublicSiteController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
