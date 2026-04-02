import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { InitAdminDto } from './dto/init-admin.dto';

export interface CurrentUserProfile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  // 仅首次开放管理员初始化，满足项目初始化阶段的最小可交付要求。
  async initAdmin(dto: InitAdminDto): Promise<CurrentUserProfile> {
    const total = await this.prismaService.user.count();

    if (total > 0) {
      throw new ConflictException({
        code: 'AUTH_INIT_ALREADY_DONE',
        message: '管理员已初始化，不能重复执行',
      });
    }

    const user = await this.prismaService.user.create({
      data: {
        username: dto.username,
        displayName: dto.displayName,
        passwordHash: this.passwordService.hashPassword(dto.password),
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    return this.toCurrentUserProfile(user);
  }

  // 当前登录用户统一返回脱敏后的账户资料，不暴露密码哈希。
  async getCurrentUserProfile(userId: string): Promise<CurrentUserProfile> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    return this.toCurrentUserProfile(user);
  }

  // 最小阶段先支持当前登录用户修改自己的密码，为后台继续开发提供基础安全能力。
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      });
    }

    if (!this.passwordService.verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: '当前密码不正确',
      });
    }

    if (currentPassword === newPassword) {
      throw new ConflictException({
        code: 'USER_PASSWORD_UNCHANGED',
        message: '新密码不能与当前密码相同',
      });
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        passwordHash: this.passwordService.hashPassword(newPassword),
      },
    });
  }

  private toCurrentUserProfile(user: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CurrentUserProfile {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}