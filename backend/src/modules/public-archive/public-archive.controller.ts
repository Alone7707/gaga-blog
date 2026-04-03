import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { PublicListArchivesQueryDto } from './dto/public-list-archives-query.dto';
import { PublicArchiveService } from './public-archive.service';

@ApiTags('Public Archive')
@Public()
@Controller('public/archives')
export class PublicArchiveController {
  constructor(private readonly publicArchiveService: PublicArchiveService) {}

  @Get()
  @ApiOperation({ summary: '获取公开归档列表' })
  async list(@Query() query: PublicListArchivesQueryDto) {
    return await this.publicArchiveService.listArchives(query);
  }
}
