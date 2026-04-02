import { Controller, Get } from '@nestjs/common';

@Controller('system/health')
export class HealthController {
  @Get()
  getHealth() {
    // 当前阶段先提供最小健康检查接口，后续可扩展数据库与依赖探活。
    return {
      status: 'ok',
      service: 'blog-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
