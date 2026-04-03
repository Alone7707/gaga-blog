import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { SettingService } from './setting.service';

@ApiTags('Public Site')
@Public()
@Controller('public/site')
export class PublicSiteController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: '获取公开可见的站点设置' })
  async getSiteSettings() {
    return await this.settingService.getPublicSiteSettings();
  }

  @Get('overview')
  @ApiOperation({ summary: '获取前台可直接消费的站点概览信息' })
  async getSiteOverview() {
    return {
      overview: await this.settingService.getPublicSiteOverview(),
    };
  }
}
