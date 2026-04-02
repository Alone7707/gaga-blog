import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { PublicTaxonomyController } from './public-taxonomy.controller';
import { PublicTaxonomyService } from './public-taxonomy.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicTaxonomyController],
  providers: [PublicTaxonomyService],
  exports: [PublicTaxonomyService],
})
export class PublicTaxonomyModule {}
