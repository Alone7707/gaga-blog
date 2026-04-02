import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewCommentDto {
  @ApiPropertyOptional({ description: '审核备注，最大 200 字' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
