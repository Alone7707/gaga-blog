import { Injectable } from '@nestjs/common';
import { CommentStatus, PostStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

type RecentPostPayload = Prisma.PostGetPayload<{
  include: {
    category: true;
    author: true;
    _count: {
      select: {
        comments: true;
      };
    };
  };
}>;

type RecentCommentPayload = Prisma.CommentGetPayload<{
  include: {
    post: true;
  };
}>;

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  // 管理员仪表盘首页先提供最小统计能力，满足概览卡片和最近动态展示。
  async getDashboardOverview() {
    const [
      postTotal,
      publishedPostTotal,
      draftPostTotal,
      categoryTotal,
      tagTotal,
      commentTotal,
      pendingCommentTotal,
      approvedCommentTotal,
      recentPosts,
      recentComments,
    ] = await this.prismaService.$transaction([
      this.prismaService.post.count({
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.post.count({
        where: {
          deletedAt: null,
          status: PostStatus.PUBLISHED,
        },
      }),
      this.prismaService.post.count({
        where: {
          deletedAt: null,
          status: PostStatus.DRAFT,
        },
      }),
      this.prismaService.category.count(),
      this.prismaService.tag.count(),
      this.prismaService.comment.count(),
      this.prismaService.comment.count({
        where: {
          status: CommentStatus.PENDING,
        },
      }),
      this.prismaService.comment.count({
        where: {
          status: CommentStatus.APPROVED,
        },
      }),
      this.prismaService.post.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [
          { createdAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        take: 5,
        include: {
          category: true,
          author: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      }),
      this.prismaService.comment.findMany({
        orderBy: [{ createdAt: 'desc' }],
        take: 5,
        include: {
          post: true,
        },
      }),
    ]);

    return {
      stats: {
        posts: {
          total: postTotal,
          published: publishedPostTotal,
          draft: draftPostTotal,
        },
        categories: {
          total: categoryTotal,
        },
        tags: {
          total: tagTotal,
        },
        comments: {
          total: commentTotal,
          pending: pendingCommentTotal,
          approved: approvedCommentTotal,
        },
      },
      recentPosts: recentPosts.map((item) => this.toRecentPostItem(item)),
      recentComments: recentComments.map((item) => this.toRecentCommentItem(item)),
    };
  }

  private toRecentPostItem(post: RecentPostPayload) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      commentCount: post._count.comments,
      author: {
        id: post.author.id,
        username: post.author.username,
        displayName: post.author.displayName,
      },
      category: post.category
        ? {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
          }
        : null,
    };
  }

  private toRecentCommentItem(comment: RecentCommentPayload) {
    return {
      id: comment.id,
      postId: comment.postId,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      content: comment.content,
      status: comment.status,
      createdAt: comment.createdAt,
      approvedAt: comment.approvedAt,
      post: {
        id: comment.post.id,
        title: comment.post.title,
        slug: comment.post.slug,
      },
    };
  }
}
