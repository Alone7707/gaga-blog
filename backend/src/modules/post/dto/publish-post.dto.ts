import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PublishPostDto {
  @ApiPropertyOptional({ description: '发布时间，ISO 字符串；不传则默认当前时间' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
