import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { PublicSearchQueryDto } from './dto/public-search-query.dto';
import { PublicSearchService } from './public-search.service';

@ApiTags('Public Search')
@Public()
@Controller('public/search')
export class PublicSearchController {
  constructor(private readonly publicSearchService: PublicSearchService) {}

  @Get()
  @ApiOperation({ summary: '公开搜索文章' })
  async search(@Query() query: PublicSearchQueryDto) {
    return await this.publicSearchService.searchPosts(query);
  }
}
