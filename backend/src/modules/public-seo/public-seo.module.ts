import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { SettingModule } from '../setting/setting.module';
import { PublicSeoController } from './public-seo.controller';
import { PublicSeoService } from './public-seo.service';

@Module({
  imports: [PrismaModule, SettingModule],
  controllers: [PublicSeoController],
  providers: [PublicSeoService],
})
export class PublicSeoModule {}
