import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ListCommentQueryDto } from './dto/list-comment-query.dto';
import { ReviewCommentDto } from './dto/review-comment.dto';

type ReviewableCommentStatus = 'APPROVED' | 'REJECTED' | 'SPAM';

const COMMENT_LIST_INCLUDE = {
  post: true,
  parent: true,
  reviewedBy: true,
  replies: {
    where: {
      status: CommentStatus.APPROVED,
    },
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentInclude;

const COMMENT_DETAIL_INCLUDE = {
  post: true,
  parent: true,
  reviewedBy: true,
  replies: {
    include: {
      reviewedBy: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.CommentInclude;

type CommentListPayload = Prisma.CommentGetPayload<{
  include: typeof COMMENT_LIST_INCLUDE;
}>;

type CommentDetailPayload = Prisma.CommentGetPayload<{
  include: typeof COMMENT_DETAIL_INCLUDE;
}>;

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  // 评论统计概览统一收口，便于后台审核台直接消费卡片数据。
  async getCommentStats() {
    const [total, pending, approved, rejected, spam, latestComment] = await this.prismaService.$transaction([
      this.prismaService.comment.count(),
      this.prismaService.comment.count({
        where: { status: CommentStatus.PENDING },
      }),
      this.prismaService.comment.count({
        where: { status: CommentStatus.APPROVED },
      }),
      this.prismaService.comment.count({
        where: { status: CommentStatus.REJECTED },
      }),
      this.prismaService.comment.count({
        where: { status: CommentStatus.SPAM },
      }),
      this.prismaService.comment.findFirst({
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      spam,
      pendingRate: total === 0 ? 0 : Number((pending / total).toFixed(4)),
      approvedRate: total === 0 ? 0 : Number((approved / total).toFixed(4)),
      latestComment: latestComment
        ? {
            id: latestComment.id,
            createdAt: latestComment.createdAt,
            post: latestComment.post,
          }
        : null,
    };
  }

  // 后台评论列表支持按状态、文章与关键词筛选，满足审核台最小交付能力。
  async listComments(query: ListCommentQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const keyword = query.keyword?.trim();

    const where: Prisma.CommentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.postId ? { postId: query.postId } : {}),
      ...(keyword
        ? {
            OR: [
              { authorName: { contains: keyword } },
              { authorEmail: { contains: keyword } },
              { content: { contains: keyword } },
              { post: { title: { contains: keyword } } },
            ],
          }
        : {}),
    };

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.comment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: COMMENT_LIST_INCLUDE,
      }),
      this.prismaService.comment.count({ where }),
    ]);

    return {
      list: list.map((item) => this.toAdminCommentListItem(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  // 详情接口保留审核备注、邮箱与回复链路，便于后台在单页中直接处理。
  async getCommentDetail(id: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
      include: COMMENT_DETAIL_INCLUDE,
    });

    if (!comment) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: '评论不存在',
      });
    }

    return this.toAdminCommentDetail(comment);
  }

  // 审核动作统一收口，避免通过、驳回、垃圾评论三套重复逻辑。
  async reviewComment(
    id: string,
    status: ReviewableCommentStatus,
    reviewerId: string,
    dto: ReviewCommentDto,
  ) {
    const existing = await this.prismaService.comment.findUnique({
      where: { id },
      include: COMMENT_DETAIL_INCLUDE,
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'COMMENT_NOT_FOUND',
        message: '评论不存在',
      });
    }

    const updated = await this.prismaService.comment.update({
      where: { id },
      data: {
        status,
        reviewReason: this.normalizeOptionalText(dto.reason),
        reviewedById: reviewerId,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: COMMENT_DETAIL_INCLUDE,
    });

    return this.toAdminCommentDetail(updated);
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private toAdminCommentListItem(comment: CommentListPayload) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorWebsite: comment.authorWebsite,
      content: comment.content,
      status: comment.status,
      reviewReason: comment.reviewReason,
      ipHash: comment.ipHash,
      userAgent: comment.userAgent,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      approvedAt: comment.approvedAt,
      post: {
        id: comment.post.id,
        title: comment.post.title,
        slug: comment.post.slug,
      },
      parent: comment.parent
        ? {
            id: comment.parent.id,
            authorName: comment.parent.authorName,
            content: comment.parent.content,
          }
        : null,
      reviewedBy: comment.reviewedBy
        ? {
            id: comment.reviewedBy.id,
            username: comment.reviewedBy.username,
            displayName: comment.reviewedBy.displayName,
          }
        : null,
      replyCount: comment._count.replies,
      approvedReplyCount: comment.replies.length,
    };
  }

  private toAdminCommentDetail(comment: CommentDetailPayload) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorWebsite: comment.authorWebsite,
      content: comment.content,
      status: comment.status,
      reviewReason: comment.reviewReason,
      ipHash: comment.ipHash,
      userAgent: comment.userAgent,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      approvedAt: comment.approvedAt,
      post: {
        id: comment.post.id,
        title: comment.post.title,
        slug: comment.post.slug,
      },
      parent: comment.parent
        ? {
            id: comment.parent.id,
            authorName: comment.parent.authorName,
            content: comment.parent.content,
            status: comment.parent.status,
          }
        : null,
      reviewedBy: comment.reviewedBy
        ? {
            id: comment.reviewedBy.id,
            username: comment.reviewedBy.username,
            displayName: comment.reviewedBy.displayName,
          }
        : null,
      replies: comment.replies.map((item) => ({
        id: item.id,
        authorName: item.authorName,
        content: item.content,
        status: item.status,
        reviewReason: item.reviewReason,
        createdAt: item.createdAt,
        approvedAt: item.approvedAt,
        reviewedBy: item.reviewedBy
          ? {
              id: item.reviewedBy.id,
              username: item.reviewedBy.username,
              displayName: item.reviewedBy.displayName,
            }
          : null,
      })),
    };
  }
}
