import { Injectable } from '@nestjs/common';
import { PostStatus, PostVisibility, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_PUBLISHED_POST_WHERE = {
  deletedAt: null,
  status: PostStatus.PUBLISHED,
  visibility: PostVisibility.PUBLIC,
  publishedAt: {
    not: null,
    lte: new Date(),
  },
} satisfies Prisma.PostWhereInput;

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
}
