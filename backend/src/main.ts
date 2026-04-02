import 'reflect-metadata';

import cookie from '@fastify/cookie';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap(): Promise<void> {
  // 创建基于 Fastify 的 Nest 应用，便于后续长期维护和性能扩展。
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // 注册 Cookie 插件，为 JWT HttpOnly Cookie 鉴权方案提供基础能力。
  await app.register(cookie);

  app.setGlobalPrefix('api');

  // 统一启用参数校验与格式转换，减少控制器中的样板代码。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 统一响应结构与异常输出，作为后续所有模块的公共基础能力。
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('开源博客后端 API')
    .setDescription('开源博客产品后端初始化版本接口文档')
    .setVersion('0.2.0')
    .addCookieAuth('blog_admin_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'blog_admin_token',
    })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`后端服务已启动: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger 文档地址: http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();