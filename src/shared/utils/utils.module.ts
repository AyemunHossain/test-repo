import { Global, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsSchema } from '../../schema/news.schema';
import { NewsCategorySchema } from '../../schema/news-category.schema';
import { NewsSourcesSchema } from '../../schema/news-sources.schema';

@Global()
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: 'News', schema: NewsSchema },
      { name: 'NewsCategory', schema: NewsCategorySchema },
      { name: 'NewsSources', schema: NewsSourcesSchema },
    ]),
  ],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
