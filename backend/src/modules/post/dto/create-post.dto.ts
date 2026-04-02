import { PostStatus, PostVisibility } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: '文章标题' })
  @IsString()
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ description: '文章 slug，不传时将基于标题自动生成' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ description: '文章摘要' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ description: 'Markdown 正文内容' })
  @IsString()
  contentMarkdown!: string;

  @ApiPropertyOptional({ description: '预渲染 HTML 内容' })
  @IsOptional()
  @IsString()
  contentHtml?: string;

  @ApiPropertyOptional({ description: '封面图地址' })
  @IsOptional()
  @IsUrl({}, { message: 'coverImage 必须是合法的 URL' })
  coverImage?: string;

  @ApiPropertyOptional({ enum: PostStatus, description: '文章状态，默认草稿' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ enum: PostVisibility, description: '文章可见性，默认公开' })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ description: 'SEO 标题' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO 描述' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  @ApiPropertyOptional({ description: '发布时间，ISO 字符串' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: '分类 ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: '标签 ID 列表，用于同步文章标签关系',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tagIds?: string[];
}
