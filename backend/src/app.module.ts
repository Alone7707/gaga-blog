import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { CommentModule } from './modules/comment/comment.module';
import { HealthModule } from './modules/health/health.module';
import { PostModule } from './modules/post/post.module';
import { PublicArchiveModule } from './modules/public-archive/public-archive.module';
import { PublicCommentModule } from './modules/public-comment/public-comment.module';
import { PublicPostModule } from './modules/public-post/public-post.module';
import { PublicSearchModule } from './modules/public-search/public-search.module';
import { PublicTaxonomyModule } from './modules/public-taxonomy/public-taxonomy.module';
import { TagModule } from './modules/tag/tag.module';
import { UserModule } from './modules/user/user.module';
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
    CommentModule,
    PublicPostModule,
    PublicCommentModule,
    PublicArchiveModule,
    PublicSearchModule,
    PublicTaxonomyModule,
    CategoryModule,
    TagModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
