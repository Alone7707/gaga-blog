import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyCommentDto {
  @ApiProperty({ description: '管理员回复内容', minLength: 2, maxLength: 1000 })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ description: '回复备注，最大 200 字' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
