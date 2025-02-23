import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobSchedulerService } from './job-scheduler.service';
import { NewsService } from '../../pages/news/news.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { NewsSchema } from '../../schema/news.schema';
import { NewsCategorySchema } from '../../schema/news-category.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enables scheduling
    HttpModule,
    MongooseModule.forFeature([
      { name: 'News', schema: NewsSchema },
      { name: 'NewsCategory', schema: NewsCategorySchema },
    ]),
  ],
  providers: [JobSchedulerService, NewsService],
})
export class JobSchedulerModule {}
