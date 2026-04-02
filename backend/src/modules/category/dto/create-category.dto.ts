import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: '分类 slug，不传时将基于名称自动生成' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ description: '分类描述' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ description: '分类排序，值越小越靠前', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}
