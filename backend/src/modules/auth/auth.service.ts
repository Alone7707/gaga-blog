import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserProfile } from '../user/user.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  // 登录前先校验管理员是否已初始化，避免接口表现含糊不清。
  async ensureAdminInitialized(): Promise<void> {
    const total = await this.prismaService.user.count();

    if (total > 0) {
      return;
    }

    throw new ConflictException({
      code: 'AUTH_INIT_REQUIRED',
      message: '请先初始化管理员账号',
    });
  }

  // 登录流程统一封装在服务层，控制器仅处理入参与 cookie 写入。
  async login(username: string, password: string): Promise<{
    accessToken: string;
    expiresIn: number;
    user: CurrentUserProfile;
  }> {
    const user = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (!user || !this.passwordService.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: '用户名或密码错误',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'AUTH_ACCOUNT_DISABLED',
        message: '当前账号已被禁用',
      });
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const currentUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      lastLoginAt: new Date(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const accessToken = await this.tokenService.signAccessToken({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });

    return {
      accessToken,
      expiresIn: this.tokenService.getJwtExpiresInSeconds(),
      user: currentUser,
    };
  }

  getCookieName(): string {
    return this.tokenService.getCookieName();
  }

  getCookieOptions() {
    return this.tokenService.getCookieOptions();
  }
}