import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommentStatus } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CommentService } from './comment.service';
import { ListCommentQueryDto } from './dto/list-comment-query.dto';
import { ReviewCommentDto } from './dto/review-comment.dto';

@ApiTags('Comment')
@ApiCookieAuth('blog_admin_token')
@Controller('admin/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: '获取后台评论列表' })
  async list(@Query() query: ListCommentQueryDto) {
    return await this.commentService.listComments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取后台评论详情' })
  async detail(@Param('id') id: string) {
    return {
      comment: await this.commentService.getCommentDetail(id),
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审核通过评论' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() query: ReviewCommentDto,
  ) {
    return {
      comment: await this.commentService.reviewComment(
        id,
        CommentStatus.APPROVED,
        currentUser.userId,
        query,
      ),
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '驳回评论' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() query: ReviewCommentDto,
  ) {
    return {
      comment: await this.commentService.reviewComment(
        id,
        CommentStatus.REJECTED,
        currentUser.userId,
        query,
      ),
    };
  }

  @Post(':id/spam')
  @ApiOperation({ summary: '标记垃圾评论' })
  async markSpam(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() query: ReviewCommentDto,
  ) {
    return {
      comment: await this.commentService.reviewComment(
        id,
        CommentStatus.SPAM,
        currentUser.userId,
        query,
      ),
    };
  }
}
