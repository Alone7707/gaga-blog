import { BadRequestException, Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicSearchQueryDto } from './dto/public-search-query.dto';

@Injectable()
export class PublicSearchService {
  constructor(private readonly prismaService: PrismaService) {}

  // 公开搜索只检索公开且已发布文章，避免草稿、私有内容或未来文章被暴露。
  async searchPosts(query: PublicSearchQueryDto) {
    const keyword = query.q?.trim();

    if (!keyword) {
      throw new BadRequestException({
        code: 'SEARCH_QUERY_EMPTY',
        message: '搜索关键词不能为空',
      });
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const now = new Date();

    const where = {
      deletedAt: null,
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
      publishedAt: {
        not: null,
        lte: now,
      },
      OR: [
        { title: { contains: keyword } },
        { slug: { contains: keyword } },
        { summary: { contains: keyword } },
        { contentMarkdown: { contains: keyword } },
        {
          postTags: {
            some: {
              tag: {
                OR: [{ name: { contains: keyword } }, { slug: { contains: keyword } }],
              },
            },
          },
        },
      ],
    };

    const [posts, total] = await this.prismaService.$transaction([
      this.prismaService.post.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          author: true,
          postTags: {
            include: {
              tag: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      }),
      this.prismaService.post.count({ where }),
    ]);

    return {
      keyword,
      list: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: this.buildSummary(post.summary, post.contentMarkdown, keyword),
        excerpt: this.buildExcerpt(post.summary, post.contentMarkdown, keyword),
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.author.id,
          displayName: post.author.displayName,
        },
        category: post.category
          ? {
              id: post.category.id,
              name: post.category.name,
              slug: post.category.slug,
            }
          : null,
        tags: post.postTags.map((item) => ({
          id: item.tag.id,
          name: item.tag.name,
          slug: item.tag.slug,
        })),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 优先使用显式摘要；若没有摘要，则从正文中截取基础摘要，便于搜索结果直接展示。
  private buildSummary(summary: string | null, contentMarkdown: string, keyword: string) {
    const normalizedSummary = summary?.trim();

    if (normalizedSummary) {
      return normalizedSummary;
    }

    return this.buildExcerpt(null, contentMarkdown, keyword, 120);
  }

  // 基础高亮片段先做纯文本截断，不引入复杂渲染逻辑，满足 MVP 搜索结果展示。
  private buildExcerpt(
    summary: string | null,
    contentMarkdown: string,
    keyword: string,
    maxLength = 160,
  ) {
    const sourceText = `${summary ?? ''} ${contentMarkdown}`
      .replace(/[#>*`\-\[\]\(\)!_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!sourceText) {
      return '';
    }

    const normalizedKeyword = keyword.toLowerCase();
    const matchedIndex = sourceText.toLowerCase().indexOf(normalizedKeyword);

    if (matchedIndex < 0) {
      return sourceText.slice(0, maxLength);
    }

    const start = Math.max(0, matchedIndex - Math.floor(maxLength / 3));
    const end = Math.min(sourceText.length, start + maxLength);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < sourceText.length ? '...' : '';

    return `${prefix}${sourceText.slice(start, end)}${suffix}`;
  }
}
