import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSettingItemDto {
  @ApiProperty({ description: '配置键，例如 site.title' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: '配置值，类型需与配置定义保持一致' })
  @IsDefined()
  value!: unknown;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: [UpdateSettingItemDto], description: '待更新配置项列表' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingItemDto)
  items!: UpdateSettingItemDto[];
}
