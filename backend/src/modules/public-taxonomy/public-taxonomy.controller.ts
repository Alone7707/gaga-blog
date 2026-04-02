import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { PublicListPostsQueryDto } from '../public-post/dto/public-list-posts-query.dto';
import { PublicTaxonomyService } from './public-taxonomy.service';

@ApiTags('Public Taxonomy')
@Public()
@Controller('public')
export class PublicTaxonomyController {
  constructor(private readonly publicTaxonomyService: PublicTaxonomyService) {}

  @Get('categories')
  @ApiOperation({ summary: '获取公开分类列表' })
  async listCategories() {
    return {
      list: await this.publicTaxonomyService.listCategories(),
    };
  }

  @Get('categories/:slug/posts')
  @ApiOperation({ summary: '根据分类 slug 获取公开文章列表' })
  async listCategoryPosts(
    @Param('slug') slug: string,
    @Query() query: PublicListPostsQueryDto,
  ) {
    return await this.publicTaxonomyService.listPostsByCategorySlug(slug, query);
  }

  @Get('tags')
  @ApiOperation({ summary: '获取公开标签列表' })
  async listTags() {
    return {
      list: await this.publicTaxonomyService.listTags(),
    };
  }

  @Get('tags/:slug/posts')
  @ApiOperation({ summary: '根据标签 slug 获取公开文章列表' })
  async listTagPosts(
    @Param('slug') slug: string,
    @Query() query: PublicListPostsQueryDto,
  ) {
    return await this.publicTaxonomyService.listPostsByTagSlug(slug, query);
  }
}
