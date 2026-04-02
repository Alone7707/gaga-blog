import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InitAdminDto } from './dto/init-admin.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('init')
  @ApiOperation({ summary: '初始化管理员账号，仅首次可执行' })
  async initAdmin(@Body() dto: InitAdminDto) {
    return {
      user: await this.userService.initAdmin(dto),
    };
  }

  @Patch('password')
  @ApiOperation({ summary: '修改当前登录管理员密码' })
  @ApiCookieAuth('blog_admin_token')
  async changePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(
      currentUser.userId,
      dto.currentPassword,
      dto.newPassword,
    );

    return {};
  }
}