import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export interface AuthTokenPayload extends AuthenticatedUser {}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 统一签发 JWT，避免控制器和业务层直接依赖底层签名细节。
  async signAccessToken(user: AuthenticatedUser): Promise<string> {
    return this.jwtService.signAsync(user, {
      secret: this.getJwtSecret(),
      expiresIn: this.getJwtExpiresInSeconds(),
    });
  }

  // 守卫和服务都通过同一入口解析 token，减少签名配置分散。
  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    return this.jwtService.verifyAsync<AuthTokenPayload>(token, {
      secret: this.getJwtSecret(),
    });
  }

  getCookieName(): string {
    return this.configService.get<string>('AUTH_COOKIE_NAME') || 'blog_admin_token';
  }

  getCookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.configService.get<string>('AUTH_COOKIE_SECURE') === 'true',
      path: '/',
    };
  }

  getJwtExpiresInSeconds(): number {
    const raw = this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') || '86400';
    const parsed = Number(raw);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 86400;
  }

  private getJwtSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') ||
      'please-change-this-secret-in-local-env'
    );
  }
}