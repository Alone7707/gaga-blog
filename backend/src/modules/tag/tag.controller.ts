import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateTagDto } from './dto/create-tag.dto';
import { ListTagQueryDto } from './dto/list-tag-query.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagService } from './tag.service';

@ApiTags('Tag')
@ApiCookieAuth('blog_admin_token')
@Controller('admin/tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiOperation({ summary: '获取后台标签列表' })
  async list(@Query() query: ListTagQueryDto) {
    return this.tagService.listTags(query);
  }

  @Post()
  @ApiOperation({ summary: '创建标签' })
  async create(@Body() dto: CreateTagDto) {
    return {
      tag: await this.tagService.createTag(dto),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标签' })
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return {
      tag: await this.tagService.updateTag(id, dto),
    };
  }
}
