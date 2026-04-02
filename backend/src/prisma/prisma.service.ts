import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    // 应用启动时主动建立数据库连接，尽早暴露底层问题。
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // 统一处理 Prisma 连接释放，避免开发态热更新后连接残留。
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
