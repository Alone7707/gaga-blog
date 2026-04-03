import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { Public } from '../auth/decorators/public.decorator';
import { PublicSeoService } from './public-seo.service';

@ApiTags('Public SEO')
@Public()
@Controller()
export class PublicSeoController {
  constructor(private readonly publicSeoService: PublicSeoService) {}

  @Get('public/seo/manifest')
  @ApiOperation({ summary: '获取公开 SEO 清单' })
  async getManifest() {
    return {
      manifest: await this.publicSeoService.getSeoManifest(),
    };
  }

  @Get('rss.xml')
  @ApiProduces('application/rss+xml')
  @ApiOperation({ summary: '获取 RSS 订阅 XML' })
  async getRss(@Res() reply: FastifyReply) {
    const site = await this.publicSeoService.getSeoSiteContext();

    if (!site.enableRss) {
      return reply.code(404).type('text/plain; charset=UTF-8').send('RSS is disabled');
    }

    return reply
      .code(200)
      .type('application/rss+xml; charset=UTF-8')
      .send(await this.publicSeoService.buildRssXml());
  }

  @Get('sitemap.xml')
  @ApiProduces('application/xml')
  @ApiOperation({ summary: '获取站点地图 XML' })
  async getSitemap(@Res() reply: FastifyReply) {
    const site = await this.publicSeoService.getSeoSiteContext();

    if (!site.enableSitemap) {
      return reply.code(404).type('text/plain; charset=UTF-8').send('Sitemap is disabled');
    }

    return reply
      .code(200)
      .type('application/xml; charset=UTF-8')
      .send(await this.publicSeoService.buildSitemapXml());
  }

  @Get('robots.txt')
  @ApiProduces('text/plain')
  @ApiOperation({ summary: '获取 robots 文本' })
  async getRobots(@Res() reply: FastifyReply) {
    return reply
      .code(200)
      .type('text/plain; charset=UTF-8')
      .send(await this.publicSeoService.buildRobotsTxt());
  }
}
