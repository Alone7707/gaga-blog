import {
  Body,
  Controller,
  Get,
  Post,
  Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

@ApiTags('Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.login(dto.username, dto.password);

    // 登录成功后写入 HttpOnly Cookie，供后台后续接口复用。
    reply.setCookie(
      this.authService.getCookieName(),
      result.accessToken,
      this.authService.getCookieOptions(),
    );

    return {
      user: result.user,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: '管理员登出' })
  @ApiCookieAuth('blog_admin_token')
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    // 当前阶段采用基础 JWT 方案，登出时先清理服务端下发的 Cookie。
    reply.clearCookie(
      this.authService.getCookieName(),
      this.authService.getCookieOptions(),
    );

    return {};
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前登录管理员信息' })
  @ApiCookieAuth('blog_admin_token')
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    return {
      user: await this.userService.getCurrentUserProfile(currentUser.userId),
    };
  }
}