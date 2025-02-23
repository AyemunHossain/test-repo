import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsService } from '../../pages/news/news.service';
import { UtilsService } from '../../shared/utils/utils.service';
import { News } from 'src/interfaces/common/news.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NewsCategory } from '../../interfaces/common/news-category.interface';
@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectModel('News') private readonly newsModel: Model<News>,
    @InjectModel('NewsCategory')
    private readonly newsCategoryModel: Model<NewsCategory>,
    private readonly newsService: NewsService,
    private utilsService: UtilsService,
  ) {}

  // Function to filter duplicates and insert articles
  async filterAndInsertArticles(articles: News[]): Promise<News[]> {
    // Check for existing articles by URL
    const existingUrls = await this.newsModel
      .find({ url: { $in: articles.map((article) => article.url) } })
      .select('url');

    // Filter out articles that already exist
    const newArticles = articles.filter(
      (article) =>
        !existingUrls.some((existing) => existing.url === article.url),
    );

    if (newArticles.length > 0) {
      // Insert the new articles into the database
      await this.newsModel.insertMany(newArticles, { ordered: false });
      return newArticles;
    } else {
      return [];
    }
  }

  /**
   * Scheduled job to fetch and save latest news every 30 minutes
   */
  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'fetch_news_job' })
  async fetchAndStoreNews(): Promise<void> {
    this.logger.log('Starting scheduled news fetch...');

    try {
      const [nytArticles, newsApiArticles]: [News[], News[]] =
        await Promise.all([
          this.utilsService.fetchFromNYT(),
          this.utilsService.fetchFromNewsAPI(),
        ]);

      // handle duplicate news
      await Promise.all([
        this.filterAndInsertArticles(nytArticles),
        this.filterAndInsertArticles(newsApiArticles),
      ]);

      this.logger.log('News saved successfully.');
    } catch (error) {
      this.logger.error('Error in scheduled news fetching:', error);
    }
  }
}
