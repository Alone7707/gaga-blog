import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, PostVisibility, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PublicListPostsQueryDto } from '../public-post/dto/public-list-posts-query.dto';

const PUBLIC_PUBLISHED_POST_WHERE = {
  deletedAt: null,
  status: PostStatus.PUBLISHED,
  visibility: PostVisibility.PUBLIC,
  publishedAt: {
    not: null,
    lte: new Date(),
  },
} satisfies Prisma.PostWhereInput;

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

type PublicTaxonomyPostPayload = Prisma.PostGetPayload<{
  include: typeof PUBLIC_POST_INCLUDE;
}>;

@Injectable()
export class PublicTaxonomyService {
  constructor(private readonly prismaService: PrismaService) {}

  // 公开分类列表只返回分类基础信息与公开文章数量，不泄露草稿和私有内容。
  async listCategories() {
    const [categories, publicPosts] = await this.prismaService.$transaction([
      this.prismaService.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prismaService.post.findMany({
        where: {
          ...PUBLIC_PUBLISHED_POST_WHERE,
          categoryId: {
            not: null,
          },
        },
        select: {
          categoryId: true,
        },
      }),
    ]);

    const categoryPostCountMap = publicPosts.reduce<Map<string, number>>((accumulator, post) => {
      if (!post.categoryId) {
        return accumulator;
      }

      const currentCount = accumulator.get(post.categoryId) ?? 0;
      accumulator.set(post.categoryId, currentCount + 1);
      return accumulator;
    }, new Map<string, number>());

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
      postCount: categoryPostCountMap.get(category.id) ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  // 分类文章列表仅返回公开且已发布文章，并保留统一分页结构。
  async listPostsByCategorySlug(slug: string, query: PublicListPostsQueryDto) {
    const normalizedSlug = slug.trim();
    const category = await this.prismaService.category.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: '分类不存在',
      });
    }

    const where: Prisma.PostWhereInput = {
      ...this.buildPublicPostWhere(query),
      categoryId: category.id,
    };

    const { list, pagination } = await this.listPublicPosts(where, query);

    return {
      category,
      list,
      pagination,
    };
  }

  // 公开标签列表按公开文章使用次数倒序返回，便于前台直接渲染标签区块。
  async listTags() {
    const [tags, publicPostTags] = await this.prismaService.$transaction([
      this.prismaService.tag.findMany({
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prismaService.postTag.findMany({
        where: {
          post: PUBLIC_PUBLISHED_POST_WHERE,
        },
        select: {
          tagId: true,
        },
      }),
    ]);

    const tagPostCountMap = publicPostTags.reduce<Map<string, number>>((accumulator, relation) => {
      const currentCount = accumulator.get(relation.tagId) ?? 0;
      accumulator.set(relation.tagId, currentCount + 1);
      return accumulator;
    }, new Map<string, number>());

    return tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tagPostCountMap.get(tag.id) ?? 0,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      }))
      .sort((previousTag, nextTag) => {
        if (nextTag.postCount !== previousTag.postCount) {
          return nextTag.postCount - previousTag.postCount;
        }

        return nextTag.updatedAt.getTime() - previousTag.updatedAt.getTime();
      });
  }

  // 标签文章列表按标签 slug 查询，返回标签信息、文章列表与分页信息。
  async listPostsByTagSlug(slug: string, query: PublicListPostsQueryDto) {
    const normalizedSlug = slug.trim();
    const tag = await this.prismaService.tag.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tag) {
      throw new NotFoundException({
        code: 'TAG_NOT_FOUND',
        message: '标签不存在',
      });
    }

    const where: Prisma.PostWhereInput = {
      ...this.buildPublicPostWhere(query),
      postTags: {
        some: {
          tagId: tag.id,
        },
      },
    };

    const { list, pagination } = await this.listPublicPosts(where, query);

    return {
      tag,
      list,
      pagination,
    };
  }

  // 统一封装公开文章列表查询，避免分类和标签接口重复维护分页逻辑。
  private async listPublicPosts(where: Prisma.PostWhereInput, query: PublicListPostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    const [posts, total] = await this.prismaService.$transaction([
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
      list: posts.map((post) => this.toPublicPostListItem(post)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 统一构建公开文章筛选条件，确保只查询公开且已发布内容。
  private buildPublicPostWhere(query: PublicListPostsQueryDto): Prisma.PostWhereInput {
    const keyword = query.keyword?.trim();

    return {
      ...PUBLIC_PUBLISHED_POST_WHERE,
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
  }

  // 公开文章列表项结构与现有公开文章模块保持一致，便于前端直接复用。
  private toPublicPostListItem(post: PublicTaxonomyPostPayload) {
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
}
