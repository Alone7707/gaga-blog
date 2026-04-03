import { Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SettingService } from '../setting/setting.service';
import { PublicListArchivesQueryDto } from './dto/public-list-archives-query.dto';

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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly settingService: SettingService,
  ) {}

  // 公开归档分页大小优先由后台设置驱动；缺失、脏数据或非法值时统一回退到安全默认值。
  async listArchives(query: PublicListArchivesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = await this.resolveArchivePageSize();
    const total = await this.prismaService.post.count({
      where: this.buildArchiveWhere(),
    });

    const posts = await this.prismaService.post.findMany({
      where: this.buildArchiveWhere(),
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
      total,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  private buildArchiveWhere() {
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

  private async resolveArchivePageSize() {
    const configuredPageSize = await this.settingService.getSettingValue<number>('content.archivePageSize');

    if (!Number.isInteger(configuredPageSize) || configuredPageSize <= 0) {
      return 20;
    }

    return Math.min(configuredPageSize, 100);
  }
}
