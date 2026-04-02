import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PostStatus,
  PostVisibility,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostQueryDto } from './dto/list-post-query.dto';
import { PublishPostDto } from './dto/publish-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type PostDetailPayload = Prisma.PostGetPayload<{
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

type PostListItemPayload = Prisma.PostGetPayload<{
  include: {
    author: true;
    category: true;
    _count: {
      select: {
        comments: true;
        postTags: true;
      };
    };
  };
}>;

const POST_DETAIL_INCLUDE = {
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

interface UserProfileLike {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

  // 后台文章列表统一支持分页与基础筛选，便于后续管理端直接接入。
  async listPosts(query: ListPostQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { slug: { contains: keyword } },
              { summary: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.post.findMany({
        where,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: true,
          category: true,
          _count: {
            select: {
              comments: true,
              postTags: true,
            },
          },
        },
      }),
      this.prismaService.post.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toPostListItem(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 创建文章时复用现有鉴权上下文的 userId 作为作者，保持链路简单稳定。
  async createPost(authorId: string, dto: CreatePostDto) {
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureTagsExist(dto.tagIds);

    const slug = await this.ensureUniqueSlug(dto.slug, dto.title);
    const status = dto.status ?? PostStatus.DRAFT;

    const created = await this.prismaService.post.create({
      data: {
        title: dto.title.trim(),
        slug,
        summary: this.normalizeOptionalText(dto.summary),
        contentMarkdown: dto.contentMarkdown,
        contentHtml: this.normalizeOptionalText(dto.contentHtml),
        coverImage: this.normalizeOptionalText(dto.coverImage),
        status,
        visibility: dto.visibility ?? PostVisibility.PUBLIC,
        seoTitle: this.normalizeOptionalText(dto.seoTitle),
        seoDescription: this.normalizeOptionalText(dto.seoDescription),
        publishedAt: this.resolvePublishedAt(status, dto.publishedAt),
        authorId,
        categoryId: dto.categoryId?.trim() || null,
        postTags: this.buildTagRelations(dto.tagIds),
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(created);
  }

  // 详情接口返回作者、分类和标签，避免后台详情页二次请求。
  async getPostDetail(id: string) {
    const post = await this.prismaService.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: POST_DETAIL_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '文章不存在',
      });
    }

    return this.toPostDetail(post);
  }

  // 更新接口按最小能力支持基础字段、状态和标签关系同步。
  async updatePost(id: string, dto: UpdatePostDto) {
    const existing = await this.prismaService.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        postTags: true,
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '文章不存在',
      });
    }

    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureTagsExist(dto.tagIds);

    const nextStatus = dto.status ?? existing.status;
    const nextSlug =
      dto.slug !== undefined || dto.title !== undefined
        ? await this.ensureUniqueSlug(dto.slug ?? existing.slug, dto.title ?? existing.title, id)
        : existing.slug;

    const updated = await this.prismaService.post.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        slug: nextSlug,
        ...(dto.summary !== undefined
          ? { summary: this.normalizeOptionalText(dto.summary) }
          : {}),
        ...(dto.contentMarkdown !== undefined
          ? { contentMarkdown: dto.contentMarkdown }
          : {}),
        ...(dto.contentHtml !== undefined
          ? { contentHtml: this.normalizeOptionalText(dto.contentHtml) }
          : {}),
        ...(dto.coverImage !== undefined
          ? { coverImage: this.normalizeOptionalText(dto.coverImage) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(dto.seoTitle !== undefined
          ? { seoTitle: this.normalizeOptionalText(dto.seoTitle) }
          : {}),
        ...(dto.seoDescription !== undefined
          ? { seoDescription: this.normalizeOptionalText(dto.seoDescription) }
          : {}),
        ...(dto.categoryId !== undefined
          ? { categoryId: dto.categoryId?.trim() || null }
          : {}),
        publishedAt: this.resolveUpdatedPublishedAt(existing.publishedAt, nextStatus, dto.publishedAt),
        ...(dto.tagIds !== undefined
          ? {
              postTags: {
                deleteMany: {},
                create: dto.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(updated);
  }

  // 发布接口显式收口为单独动作，便于后台状态流转按钮直接调用。
  async publishPost(id: string, dto: PublishPostDto) {
    const post = await this.findActivePostById(id);

    this.ensurePostCanBePublished(post);

    const updated = await this.prismaService.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(updated);
  }

  // 下线后回退为草稿，并清空发布时间，确保公开侧立即不可见。
  async unpublishPost(id: string) {
    const post = await this.findActivePostById(id);

    if (post.status !== PostStatus.PUBLISHED) {
      throw new ConflictException({
        code: 'POST_STATUS_INVALID',
        message: '仅已发布文章支持下线',
      });
    }

    const updated = await this.prismaService.post.update({
      where: { id },
      data: {
        status: PostStatus.DRAFT,
        publishedAt: null,
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(updated);
  }

  // 归档动作独立保留，便于后台区分“待继续编辑”和“历史沉淀”两类文章。
  async archivePost(id: string) {
    const post = await this.findActivePostById(id);

    if (post.status === PostStatus.ARCHIVED) {
      throw new ConflictException({
        code: 'POST_STATUS_INVALID',
        message: '文章已归档，请勿重复操作',
      });
    }

    const updated = await this.prismaService.post.update({
      where: { id },
      data: {
        status: PostStatus.ARCHIVED,
        publishedAt: null,
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(updated);
  }

  // 删除采用软删除，避免误操作导致文章内容无法恢复。
  async softDeletePost(id: string) {
    const post = await this.findActivePostById(id);

    const updated = await this.prismaService.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        publishedAt: null,
      },
      include: POST_DETAIL_INCLUDE,
    });

    return this.toPostDetail(updated);
  }

  private async findActivePostById(id: string) {
    const post = await this.prismaService.post.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        postTags: true,
      },
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '文章不存在',
      });
    }

    return post;
  }

  private ensurePostCanBePublished(post: { title: string; contentMarkdown: string; status: PostStatus }) {
    if (post.status === PostStatus.PUBLISHED) {
      throw new ConflictException({
        code: 'POST_STATUS_INVALID',
        message: '文章已发布，请勿重复操作',
      });
    }

    if (!post.title.trim() || !post.contentMarkdown.trim()) {
      throw new UnprocessableEntityException({
        code: 'POST_PUBLISH_INVALID',
        message: '文章标题和正文不能为空，无法发布',
      });
    }
  }

  private async ensureCategoryExists(categoryId?: string): Promise<void> {
    if (categoryId === undefined) {
      return;
    }

    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
      return;
    }

    const category = await this.prismaService.category.findUnique({
      where: { id: normalizedCategoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: '分类不存在',
      });
    }
  }

  private async ensureTagsExist(tagIds?: string[]): Promise<void> {
    if (!tagIds || tagIds.length === 0) {
      return;
    }

    const normalizedTagIds = Array.from(new Set(tagIds.map((item) => item.trim()).filter(Boolean)));

    if (normalizedTagIds.length === 0) {
      return;
    }

    const tags = await this.prismaService.tag.findMany({
      where: {
        id: { in: normalizedTagIds },
      },
      select: { id: true },
    });

    if (tags.length !== normalizedTagIds.length) {
      throw new NotFoundException({
        code: 'TAG_NOT_FOUND',
        message: '存在无效标签，请检查 tagIds',
      });
    }
  }

  private async ensureUniqueSlug(
    rawSlug: string | undefined,
    fallbackTitle: string,
    currentPostId?: string,
  ): Promise<string> {
    const baseSlug = this.normalizeSlug(rawSlug || fallbackTitle);

    if (!baseSlug) {
      throw new ConflictException({
        code: 'POST_SLUG_CONFLICT',
        message: '文章 slug 不能为空',
      });
    }

    const existing = await this.prismaService.post.findFirst({
      where: {
        slug: baseSlug,
        ...(currentPostId
          ? {
              id: { not: currentPostId },
            }
          : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({
        code: 'POST_SLUG_CONFLICT',
        message: '文章 slug 已存在，请更换后重试',
      });
    }

    return baseSlug;
  }

  private normalizeSlug(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private resolvePublishedAt(status: PostStatus, publishedAt?: string): Date | null {
    if (status !== PostStatus.PUBLISHED) {
      return null;
    }

    return publishedAt ? new Date(publishedAt) : new Date();
  }

  private resolveUpdatedPublishedAt(
    currentPublishedAt: Date | null,
    status: PostStatus,
    publishedAt?: string,
  ): Date | null {
    if (status !== PostStatus.PUBLISHED) {
      return null;
    }

    if (publishedAt) {
      return new Date(publishedAt);
    }

    return currentPublishedAt ?? new Date();
  }

  private buildTagRelations(tagIds?: string[]) {
    const normalizedTagIds = Array.from(
      new Set((tagIds ?? []).map((item) => item.trim()).filter(Boolean)),
    );

    if (normalizedTagIds.length === 0) {
      return undefined;
    }

    return {
      create: normalizedTagIds.map((tagId) => ({ tagId })),
    };
  }

  private toPostListItem(post: PostListItemPayload) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      status: post.status,
      visibility: post.visibility,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      coverImage: post.coverImage,
      author: this.toAuthor(post.author),
      category: post.category
        ? {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
          }
        : null,
      counts: {
        comments: post._count.comments,
        tags: post._count.postTags,
      },
    };
  }

  private toPostDetail(post: PostDetailPayload) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      deletedAt: post.deletedAt,
      contentMarkdown: post.contentMarkdown,
      contentHtml: post.contentHtml,
      coverImage: post.coverImage,
      status: post.status,
      visibility: post.visibility,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: this.toAuthor(post.author),
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

  private toAuthor(author: UserProfileLike) {
    return {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      role: author.role,
      status: author.status,
      lastLoginAt: author.lastLoginAt,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
    };
  }
}
