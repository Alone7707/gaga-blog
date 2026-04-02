import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { PublicPostController } from './public-post.controller';
import { PublicPostService } from './public-post.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicPostController],
  providers: [PublicPostService],
  exports: [PublicPostService],
})
export class PublicPostModule {}
