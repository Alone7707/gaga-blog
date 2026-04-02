import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostQueryDto } from './dto/list-post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@ApiTags('Post')
@ApiCookieAuth('blog_admin_token')
@Controller('admin/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiOperation({ summary: '获取后台文章列表' })
  async list(@Query() query: ListPostQueryDto) {
    return this.postService.listPosts(query);
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ) {
    return {
      post: await this.postService.createPost(currentUser.userId, dto),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async detail(@Param('id') id: string) {
    return {
      post: await this.postService.getPostDetail(id),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新文章' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return {
      post: await this.postService.updatePost(id, dto),
    };
  }
}
