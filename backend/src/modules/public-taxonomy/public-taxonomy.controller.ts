import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
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

  @Get('tags')
  @ApiOperation({ summary: '获取公开标签列表' })
  async listTags() {
    return {
      list: await this.publicTaxonomyService.listTags(),
    };
  }
}
