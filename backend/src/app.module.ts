import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';
import { PublicPostModule } from './modules/public-post/public-post.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // 全局加载环境配置，后续各业务模块可直接读取。
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    PostModule,
    PublicPostModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
