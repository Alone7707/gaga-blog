import { CommentStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCommentQueryDto {
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

  @ApiPropertyOptional({ enum: CommentStatus, description: '评论状态筛选' })
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;

  @ApiPropertyOptional({ description: '文章 ID 筛选' })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({ description: '关键词，匹配评论人、邮箱、评论内容、文章标题' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
