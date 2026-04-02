import { Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface ArchiveMonthBucket {
  month: string;
  monthLabel: string;
  count: number;
  posts: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    coverImage: string | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  }>;
}

@Injectable()
export class PublicArchiveService {
  constructor(private readonly prismaService: PrismaService) {}

  // 归档接口只输出公开且已发布文章，并按年月分组，满足前台归档页最小能力。
  async listArchives() {
    const posts = await this.prismaService.post.findMany({
      where: {
        deletedAt: null,
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        postTags: {
          include: {
            tag: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const yearMap = new Map<
      string,
      {
        year: string;
        count: number;
        months: Map<string, ArchiveMonthBucket>;
      }
    >();

    for (const post of posts) {
      if (!post.publishedAt) {
        continue;
      }

      const year = String(post.publishedAt.getFullYear());
      const monthNumber = String(post.publishedAt.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNumber}`;

      const yearBucket =
        yearMap.get(year) ??
        {
          year,
          count: 0,
          months: new Map<string, ArchiveMonthBucket>(),
        };

      const monthBucket =
        yearBucket.months.get(monthKey) ??
        {
          month: monthKey,
          monthLabel: `${year}-${monthNumber}`,
          count: 0,
          posts: [],
        };

      monthBucket.posts.push({
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
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
      });
      monthBucket.count += 1;
      yearBucket.count += 1;
      yearBucket.months.set(monthKey, monthBucket);
      yearMap.set(year, yearBucket);
    }

    const list = Array.from(yearMap.values())
      .sort((previousYear, nextYear) => Number(nextYear.year) - Number(previousYear.year))
      .map((yearBucket) => ({
        year: yearBucket.year,
        count: yearBucket.count,
        months: Array.from(yearBucket.months.values()).sort((previousMonth, nextMonth) =>
          nextMonth.month.localeCompare(previousMonth.month),
        ),
      }));

    return {
      list,
      total: posts.length,
    };
  }
}
