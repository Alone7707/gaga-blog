import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoryQueryDto } from './dto/list-category-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryService } from './category.service';

@ApiTags('Category')
@ApiCookieAuth('blog_admin_token')
@Controller('admin/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取后台分类列表' })
  async list(@Query() query: ListCategoryQueryDto) {
    return this.categoryService.listCategories(query);
  }

  @Post()
  @ApiOperation({ summary: '创建分类' })
  async create(@Body() dto: CreateCategoryDto) {
    return {
      category: await this.categoryService.createCategory(dto),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分类' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return {
      category: await this.categoryService.updateCategory(id, dto),
    };
  }
}
