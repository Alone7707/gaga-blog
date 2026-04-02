import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { PublicListPostsQueryDto } from './dto/public-list-posts-query.dto';
import { PublicPostService } from './public-post.service';

@ApiTags('Public Post')
@Public()
@Controller('public/posts')
export class PublicPostController {
  constructor(private readonly publicPostService: PublicPostService) {}

  @Get()
  @ApiOperation({ summary: '获取公开文章列表' })
  async list(@Query() query: PublicListPostsQueryDto) {
    return await this.publicPostService.listPosts(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: '根据 slug 获取公开文章详情' })
  async detail(@Param('slug') slug: string) {
    return {
      post: await this.publicPostService.getPostDetailBySlug(slug),
    };
  }
}
