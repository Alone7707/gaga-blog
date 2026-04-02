import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码', example: 'ChangeMe123!' })
  @IsString()
  @Length(8, 64)
  currentPassword!: string;

  @ApiProperty({ description: '新密码', example: 'NextPassword123!' })
  @IsString()
  @Length(8, 64)
  newPassword!: string;
}