import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCategoryQueryDto {
  @ApiPropertyOptional({ description: '页码，从 1 开始', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数，最大 100', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '关键词，匹配分类名称、slug、描述' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['sortOrder', 'createdAt', 'updatedAt', 'name'],
    default: 'sortOrder',
  })
  @IsOptional()
  @IsIn(['sortOrder', 'createdAt', 'updatedAt', 'name'])
  sortBy?: 'sortOrder' | 'createdAt' | 'updatedAt' | 'name' = 'sortOrder';

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
