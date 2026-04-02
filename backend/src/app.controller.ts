import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    // 提供一个简单入口，方便快速确认服务是否正常启动。
    return {
      name: 'blog-backend',
      version: '0.1.0',
      message: '开源博客后端服务已启动',
    };
  }
}
