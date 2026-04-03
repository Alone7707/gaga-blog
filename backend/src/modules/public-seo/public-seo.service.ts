import { Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SettingService } from '../setting/setting.service';

interface SeoSiteContext {
  title: string;
  description: string;
  baseUrl: string;
  enableRss: boolean;
  enableSitemap: boolean;
  enableRobots: boolean;
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: string;
}

@Injectable()
export class PublicSeoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly settingService: SettingService,
  ) {}

  // 统一聚合公开 SEO 基础配置，避免多个输出端重复解析站点设置。
  async getSeoSiteContext(): Promise<SeoSiteContext> {
    const overview = await this.settingService.getPublicSiteOverview();
    const site = overview.site as Record<string, unknown>;
    const seo = overview.seo as Record<string, unknown>;

    const title = this.pickString(site.title) || '我的博客';
    const description =
      this.pickString(seo.defaultDescription) ||
      this.pickString(site.description) ||
      title;

    return {
      title,
      description,
      baseUrl: this.normalizeBaseUrl(this.pickString(site.baseUrl)),
      enableRss: this.pickBoolean(seo.enableRss, true),
      enableSitemap: this.pickBoolean(seo.enableSitemap, true),
      enableRobots: this.pickBoolean(seo.enableRobots, true),
    };
  }

  // 输出给前端直接消费的 SEO 清单，便于页面 head 或静态渲染层复用。
  async getSeoManifest() {
    const site = await this.getSeoSiteContext();
    const publicPostWhere = this.buildPublishedPostWhere();
    const [latestPosts, publicCategoryCount, publicTagCount] = await Promise.all([
      this.prismaService.post.findMany({
        where: publicPostWhere,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          seoTitle: true,
          seoDescription: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      this.prismaService.category.count({
        where: {
          posts: {
            some: publicPostWhere,
          },
        },
      }),
      this.prismaService.tag.count({
        where: {
          postTags: {
            some: {
              post: publicPostWhere,
            },
          },
        },
      }),
    ]);

    return {
      site,
      endpoints: {
        rss: `${site.baseUrl}/rss.xml`,
        sitemap: `${site.baseUrl}/sitemap.xml`,
        robots: `${site.baseUrl}/robots.txt`,
      },
      stats: {
        latestPostCount: latestPosts.length,
        publicCategoryCount,
        publicTagCount,
      },
      latestPosts: latestPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        url: this.buildUrl(site.baseUrl, `/posts/${post.slug}`),
        summary: post.summary,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
      })),
    };
  }

  // RSS 仅暴露公开已发布文章，并输出标准 RSS 2.0 字段，满足 MVP 订阅能力。
  async buildRssXml() {
    const site = await this.getSeoSiteContext();
    const posts = await this.prismaService.post.findMany({
      where: this.buildPublishedPostWhere(),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      include: {
        author: true,
        category: true,
      },
    });

    const items = posts
      .map((post) => {
        const link = this.buildUrl(site.baseUrl, `/posts/${post.slug}`);
        const title = this.escapeXml(post.seoTitle?.trim() || post.title);
        const description = this.escapeXml(
          (post.seoDescription?.trim() || post.summary?.trim() || this.extractPlainText(post.contentMarkdown)).slice(
            0,
            300,
          ),
        );
        const category = post.category ? `<category>${this.escapeXml(post.category.name)}</category>` : '';
        const author = `<author>${this.escapeXml(post.author.displayName)}</author>`;
        const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();

        return [
          '    <item>',
          `      <title>${title}</title>`,
          `      <link>${this.escapeXml(link)}</link>`,
          `      <guid isPermaLink="true">${this.escapeXml(link)}</guid>`,
          `      <description>${description}</description>`,
          author,
          category,
          `      <pubDate>${pubDate}</pubDate>`,
          '    </item>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '  <channel>',
      `    <title>${this.escapeXml(site.title)}</title>`,
      `    <link>${this.escapeXml(site.baseUrl)}</link>`,
      `    <description>${this.escapeXml(site.description)}</description>`,
      `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      '    <generator>NestJS Blog Backend</generator>',
      items,
      '  </channel>',
      '</rss>',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Sitemap 聚合首页、归档页、分类/标签列表和文章详情，优先让搜索引擎直接消费。
  async buildSitemapXml() {
    const site = await this.getSeoSiteContext();
    const publicPostWhere = this.buildPublishedPostWhere();
    const [posts, categories, tags] = await Promise.all([
      this.prismaService.post.findMany({
        where: publicPostWhere,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
      this.prismaService.category.findMany({
        where: {
          posts: {
            some: publicPostWhere,
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      this.prismaService.tag.findMany({
        where: {
          postTags: {
            some: {
              post: publicPostWhere,
            },
          },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
    ]);

    const entries: SitemapEntry[] = [
      {
        loc: site.baseUrl,
        changefreq: 'daily',
        priority: '1.0',
      },
      {
        loc: this.buildUrl(site.baseUrl, '/archives'),
        changefreq: 'weekly',
        priority: '0.7',
      },
      {
        loc: this.buildUrl(site.baseUrl, '/categories'),
        changefreq: 'weekly',
        priority: '0.6',
      },
      {
        loc: this.buildUrl(site.baseUrl, '/tags'),
        changefreq: 'weekly',
        priority: '0.5',
      },
      ...posts.map((post) => ({
        loc: this.buildUrl(site.baseUrl, `/posts/${post.slug}`),
        lastmod: (post.updatedAt ?? post.publishedAt ?? new Date()).toISOString(),
        changefreq: 'weekly' as const,
        priority: '0.8',
      })),
      ...categories.map((category) => ({
        loc: this.buildUrl(site.baseUrl, `/categories/${category.slug}`),
        lastmod: category.updatedAt.toISOString(),
        changefreq: 'weekly' as const,
        priority: '0.5',
      })),
      ...tags.map((tag) => ({
        loc: this.buildUrl(site.baseUrl, `/tags/${tag.slug}`),
        lastmod: tag.updatedAt.toISOString(),
        changefreq: 'weekly' as const,
        priority: '0.4',
      })),
    ];

    const body = entries
      .map((entry) => {
        return [
          '  <url>',
          `    <loc>${this.escapeXml(entry.loc)}</loc>`,
          entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : '',
          entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : '',
          entry.priority ? `    <priority>${entry.priority}</priority>` : '',
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      body,
      '</urlset>',
    ].join('\n');
  }

  // Robots 输出同时受站点配置控制，默认放行并指向 sitemap 地址。
  async buildRobotsTxt() {
    const site = await this.getSeoSiteContext();

    if (!site.enableRobots) {
      return ['User-agent: *', 'Disallow: /'].join('\n');
    }

    return [
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${this.buildUrl(site.baseUrl, '/sitemap.xml')}`,
      `RSS: ${this.buildUrl(site.baseUrl, '/rss.xml')}`,
    ].join('\n');
  }

  private buildPublishedPostWhere() {
    return {
      deletedAt: null,
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
      publishedAt: {
        not: null,
        lte: new Date(),
      },
    };
  }

  private normalizeBaseUrl(baseUrl: string) {
    const normalized = baseUrl.trim().replace(/\/+$/, '');
    return normalized || 'http://localhost:3000';
  }

  private buildUrl(baseUrl: string, pathname: string) {
    return `${baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  }

  private pickString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private pickBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private extractPlainText(content: string) {
    return content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/[#>*\-\[\]()!_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
