import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ description: '标签 slug，不传时将基于名称自动生成' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;
}
