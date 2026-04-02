import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// 从请求对象中提取当前登录用户，避免控制器重复读取 request。
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user as AuthenticatedUser | undefined;
  },
);