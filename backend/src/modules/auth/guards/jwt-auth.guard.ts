import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: '登录状态无效或已过期',
      });
    }

    try {
      request.user = await this.tokenService.verifyAccessToken(token);
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: '登录状态无效或已过期',
      });
    }
  }

  private extractToken(request: {
    cookies?: Record<string, string>;
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const cookieName = this.tokenService.getCookieName();
    const cookieToken = request.cookies?.[cookieName];

    if (cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers?.authorization;
    const headerValue = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (headerValue?.startsWith('Bearer ')) {
      return headerValue.slice(7);
    }

    return undefined;
  }
}