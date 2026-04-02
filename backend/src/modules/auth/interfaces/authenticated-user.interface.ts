import { UserRole } from '@prisma/client';

// 统一定义鉴权态下的最小用户信息，便于控制器和守卫复用。
export interface AuthenticatedUser {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
}