import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '管理员登录名', example: 'admin' })
  @IsString()
  @Length(3, 32)
  username!: string;

  @ApiProperty({ description: '管理员密码', example: 'ChangeMe123!' })
  @IsString()
  @Length(8, 64)
  password!: string;
}