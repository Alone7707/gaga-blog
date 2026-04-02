import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, PostStatus, PostVisibility, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicCommentDto } from './dto/create-public-comment.dto';


const PUBLIC_COMMENT_INCLUDE = {
  replies: {
    where: {
      status: CommentStatus.APPROVED,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.CommentInclude;

type PublicCommentPayload = Prisma.CommentGetPayload<{
  include: typeof PUBLIC_COMMENT_INCLUDE;
}>;

interface CommentRequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class PublicCommentService {
  constructor(private readonly prismaService: PrismaService) {}

  // 前台只展示已审核通过的顶层评论，并带出同样已通过的单层回复。
  async listComments(slug: string) {
    const post = await this.findPublicPostBySlug(slug);

    const comments = await this.prismaService.comment.findMany({
      where: {
        postId: post.id,
        parentId: null,
        status: CommentStatus.APPROVED,
      },
      orderBy: [{ createdAt: 'asc' }],
      include: PUBLIC_COMMENT_INCLUDE,
    });

    return comments.map((item) => this.toPublicCommentItem(item));
  }

  // 游客提交评论默认进入待审核状态，并补充最小风控校验。
  async createComment(
    slug: string,
    dto: CreatePublicCommentDto,
    context: CommentRequestContext,
  ) {
    const post = await this.findPublicPostBySlug(slug);
    const normalizedContent = this.normalizeCommentContent(dto.content);
    const normalizedAuthorName = dto.authorName.trim();
    const normalizedAuthorEmail = this.normalizeOptionalText(dto.authorEmail)?.toLowerCase() ?? null;
    const normalizedWebsite = this.normalizeOptionalText(dto.authorWebsite);
    const ipHash = context.ip ? this.createSha256(context.ip) : null;
    const normalizedUserAgent = this.normalizeOptionalText(context.userAgent);

    const parentId = await this.validateParentComment(post.id, dto.parentId);
    await this.ensureNotDuplicated(post.id, normalizedContent, normalizedAuthorEmail, ipHash);

    const created = await this.prismaService.comment.create({
      data: {
        postId: post.id,
        parentId,
        authorName: normalizedAuthorName,
        authorEmail: normalizedAuthorEmail,
        authorWebsite: normalizedWebsite,
        content: normalizedContent,
        status: CommentStatus.PENDING,
        ipHash,
        userAgent: normalizedUserAgent,
      },
    });

    return {
      id: created.id,
      status: created.status,
      createdAt: created.createdAt,
      postId: created.postId,
      parentId: created.parentId,
      authorName: created.authorName,
      content: created.content,
      reviewMessage: '评论已提交，等待管理员审核',
    };
  }

  private async findPublicPostBySlug(slug: string) {
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
      select: {
        id: true,
        slug: true,
      },
    });

    if (!post) {
      throw new NotFoundException({
        code: 'POST_NOT_FOUND',
        message: '文章不存在或暂不可评论',
      });
    }

    return post;
  }

  private normalizeCommentContent(content: string) {
    const normalized = content.replace(/<[^>]*>/g, '').trim();

    if (normalized.length < 2 || normalized.length > 1000) {
      throw new BadRequestException({
        code: 'COMMENT_CONTENT_INVALID',
        message: '评论内容长度需在 2 到 1000 个字符之间',
      });
    }

    return normalized;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  // 父评论只允许指向同一文章下的顶层评论，确保当前版本仅支持单层回复。
  private async validateParentComment(postId: string, parentId?: string) {
    const normalizedParentId = parentId?.trim();

    if (!normalizedParentId) {
      return null;
    }

    const parent = await this.prismaService.comment.findUnique({
      where: { id: normalizedParentId },
      select: {
        id: true,
        postId: true,
        parentId: true,
      },
    });

    if (!parent || parent.postId !== postId || parent.parentId) {
      throw new BadRequestException({
        code: 'COMMENT_PARENT_INVALID',
        message: '回复目标无效，当前仅支持回复文章下的顶层评论',
      });
    }

    return parent.id;
  }

  // 最小风控先做十分钟内重复提交拦截，避免页面连续刷新造成垃圾数据。
  private async ensureNotDuplicated(
    postId: string,
    content: string,
    authorEmail: string | null,
    ipHash: string | null,
  ) {
    const duplicateWindowStart = new Date(Date.now() - 10 * 60 * 1000);
    const duplicateConditions: Prisma.CommentWhereInput[] = [
      ...(authorEmail ? [{ authorEmail }] : []),
      ...(ipHash ? [{ ipHash }] : []),
    ];

    if (duplicateConditions.length === 0) {
      return;
    }

    const duplicated = await this.prismaService.comment.findFirst({
      where: {
        postId,
        content,
        createdAt: {
          gte: duplicateWindowStart,
        },
        OR: duplicateConditions,
      },
      select: { id: true },
    });

    if (duplicated) {
      throw new ConflictException({
        code: 'COMMENT_DUPLICATED',
        message: '请勿重复提交相同评论，稍后再试',
      });
    }
  }

  private createSha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private toPublicCommentItem(comment: PublicCommentPayload) {
    return {
      id: comment.id,
      parentId: comment.parentId,
      authorName: comment.authorName,
      authorWebsite: comment.authorWebsite,
      content: comment.content,
      createdAt: comment.createdAt,
      replies: comment.replies.map((item) => ({
        id: item.id,
        parentId: item.parentId,
        authorName: item.authorName,
        authorWebsite: item.authorWebsite,
        content: item.content,
        createdAt: item.createdAt,
      })),
    };
  }
}
