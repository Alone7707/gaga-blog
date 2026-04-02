import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, PostVisibility, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicListPostsQueryDto } from './dto/public-list-posts-query.dto';

type PublicPostListItemPayload = Prisma.PostGetPayload<{
  include: {
    author: true;
    category: true;
    postTags: {
      include: {
        tag: true;
      };
    };
  };
}>;

type PublicPostDetailPayload = Prisma.PostGetPayload<{
  include: {
    author: true;
    category: true;
    postTags: {
      include: {
        tag: true;
      };
    };
  };
}>;

const PUBLIC_POST_INCLUDE = {
  author: true,
  category: true,
  postTags: {
    include: {
      tag: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.PostInclude;

@Injectable()
export class PublicPostService {
  constructor(private readonly prismaService: PrismaService) {}

  // 公开列表只返回已发布且公开可见的文章，并支持基础分页与关键词搜索。
  async listPosts(query: PublicListPostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();
    const now = new Date();

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
      publishedAt: {
        not: null,
        lte: now,
      },
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { slug: { contains: keyword } },
              { summary: { contains: keyword } },
              { contentMarkdown: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.post.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PUBLIC_POST_INCLUDE,
      }),
      this.prismaService.post.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toPublicPostListItem(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 详情通过 slug 查询，并严格限制为公开已发布文章。
  async getPostDetailBySlug(slug: string) {
    const normalizedSlug = slug.trim();

    const post = await this.prismaService.post.findFirst({
      where: {
        slug: normalizedSlug,
        deletedAt: null,
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        publishedAt: {
          not: null,
          lte: new Date(),
        },
      },
      include: PUBLIC_POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '文章不存在或暂不可见',
      });
    }

    return this.toPublicPostDetail(post);
  }

  private toPublicPostListItem(post: PublicPostListItemPayload) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
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
    };
  }

  private toPublicPostDetail(post: PublicPostDetailPayload) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      contentMarkdown: post.contentMarkdown,
      contentHtml: post.contentHtml,
      coverImage: post.coverImage,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
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
            description: post.category.description,
          }
        : null,
      tags: post.postTags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name,
        slug: item.tag.slug,
      })),
    };
  }
}
