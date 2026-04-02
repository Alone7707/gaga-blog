import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { PublicCommentController } from './public-comment.controller';
import { PublicCommentService } from './public-comment.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicCommentController],
  providers: [PublicCommentService],
})
export class PublicCommentModule {}
