import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class InitAdminDto {
  @ApiProperty({ description: '管理员登录名', example: 'admin' })
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '用户名仅支持字母、数字、下划线和中划线',
  })
  username!: string;

  @ApiProperty({ description: '管理员展示名', example: '站点管理员' })
  @IsString()
  @Length(2, 32)
  displayName!: string;

  @ApiProperty({ description: '管理员密码', example: 'ChangeMe123!' })
  @IsString()
  @Length(8, 64)
  password!: string;
}