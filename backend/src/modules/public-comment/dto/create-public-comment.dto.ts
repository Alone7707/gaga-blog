import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreatePublicCommentDto {
  @ApiProperty({ description: '评论人昵称', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  authorName!: string;

  @ApiPropertyOptional({ description: '评论人邮箱，仅后台审核可见' })
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @ApiPropertyOptional({ description: '评论人网站' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  authorWebsite?: string;

  @ApiProperty({ description: '评论内容', minLength: 2, maxLength: 1000 })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ description: '父评论 ID，仅支持回复顶层评论' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
