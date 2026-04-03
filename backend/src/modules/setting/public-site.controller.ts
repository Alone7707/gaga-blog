import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { SettingService } from './setting.service';

interface PublicSiteSettingsResponse {
  groups: Awaited<ReturnType<SettingService['getPublicSiteSettings']>>['groups'];
  values: Awaited<ReturnType<SettingService['getPublicSiteSettings']>>['values'];
}

interface PublicSiteOverviewResponse {
  overview: Awaited<ReturnType<SettingService['getPublicSiteOverview']>>;
}

interface PublicStaticPageResponse {
  page: Awaited<ReturnType<SettingService['getPublicStaticPage']>>;
}

@ApiTags('Public Site')
@Public()
@Controller('public/site')
export class PublicSiteController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: '获取公开可见的站点设置' })
  async getSiteSettings(): Promise<PublicSiteSettingsResponse> {
    return await this.settingService.getPublicSiteSettings();
  }

  @Get('overview')
  @ApiOperation({ summary: '获取前台可直接消费的站点概览信息' })
  async getSiteOverview(): Promise<PublicSiteOverviewResponse> {
    return {
      overview: await this.settingService.getPublicSiteOverview(),
    };
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: '获取公开静态页内容，当前最小支持 about 页' })
  async getStaticPage(@Param('slug') slug: string): Promise<PublicStaticPageResponse> {
    return {
      page: await this.settingService.getPublicStaticPage(slug),
    };
  }
}
