import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { CreatePublicCommentDto } from './dto/create-public-comment.dto';
import { PublicCommentService } from './public-comment.service';

@ApiTags('Public Comment')
@Public()
@Controller('public/posts/:slug/comments')
export class PublicCommentController {
  constructor(private readonly publicCommentService: PublicCommentService) {}

  @Get()
  @ApiOperation({ summary: '获取文章公开评论列表' })
  async list(@Param('slug') slug: string) {
    return {
      list: await this.publicCommentService.listComments(slug),
    };
  }

  @Post()
  @ApiOperation({ summary: '提交文章评论' })
  async create(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicCommentDto,
    @Req() request: {
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    },
  ) {
    return {
      comment: await this.publicCommentService.createComment(slug, dto, {
        ip: request.ip,
        userAgent: this.getUserAgent(request.headers?.['user-agent']),
      }),
    };
  }

  // 公开接口只提取最基础的 UA 信息，避免把整份请求对象传入业务层。
  private getUserAgent(value?: string | string[]) {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
