import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingService } from './setting.service';

@ApiTags('Setting')
@ApiCookieAuth('blog_admin_token')
@Controller('admin/settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  @ApiOperation({ summary: '获取后台全部站点设置' })
  async list(@CurrentUser() currentUser: AuthenticatedUser) {
    return await this.settingService.listAdminSettings(currentUser);
  }

  @Get('groups/:group')
  @ApiOperation({ summary: '按分组获取后台站点设置' })
  async detailByGroup(
    @Param('group') group: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.settingService.getAdminSettingsByGroup(group, currentUser);
  }

  @Patch()
  @ApiOperation({ summary: '批量更新站点设置' })
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.settingService.updateSettings(currentUser, dto);
  }
}
