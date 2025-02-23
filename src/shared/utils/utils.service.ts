import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment-timezone';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { News } from '../../interfaces/common/news.interface';
import { NewsAPIResponse } from '../../interfaces/common/news-api.interface';
import { NYTResponse } from '../../interfaces/common/nytimes-api.interface';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { NewsCategory } from 'src/interfaces/common/news-category.interface';
import { InjectModel } from '@nestjs/mongoose';
import { NewsSources } from 'src/interfaces/common/news-category.interface copy';

@Injectable()
export class UtilsService {
  private logger = new Logger(UtilsService.name);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    @InjectModel('News') private readonly newsModel: Model<News>,
    @InjectModel('NewsCategory')
    private readonly newsCategoryModel: Model<NewsCategory>,
    @InjectModel('NewsSources')
    private readonly newsSources: Model<NewsSources>,
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * MOMENT DATE FUNCTIONS
   * getDateString
   */
  getDateString(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  getLocalDateTime(): Date {
    const newDate = moment().tz('Asia/Dhaka');
    return newDate.toDate();
  }

  getDateWithCurrentTime(date: Date): Date {
    const _ = moment().tz('Asia/Dhaka');
    // const newDate = moment(date).add({hours: _.hour(), minutes:_.minute() , seconds:_.second()});
    const newDate = moment(date).add({ hours: _.hour(), minutes: _.minute() });
    return newDate.toDate();
  }

  getDateDifference(
    date1: Date | string,
    date2: Date | string,
    unit?: string,
  ): number {
    /**
     * If First Date is Current or Future Date
     * If Second Date is Expire or Old Date
     * Return Positive Value If Not Expired
     */
    const a = moment(date1).tz('Asia/Dhaka');
    const b = moment(date2).tz('Asia/Dhaka');

    switch (unit) {
      case 'seconds': {
        return b.diff(a, 'seconds');
      }
      case 'minutes': {
        return b.diff(a, 'minutes');
      }
      case 'hours': {
        return b.diff(a, 'hours');
      }
      case 'days': {
        return b.diff(a, 'days');
      }
      case 'weeks': {
        return b.diff(a, 'weeks');
      }
      default: {
        return b.diff(a, 'hours');
      }
    }
  }

  /**
   * STRING FUNCTIONS
   * transformToSlug
   */
  public transformToSlug(value: string, salt?: boolean): string {
    const slug = value
      .trim()
      .replace(/[^A-Z0-9]+/gi, '-')
      .toLowerCase();

    return salt ? `${slug}-${this.getRandomInt(1, 100)}` : slug;
  }

  /**
   * RANDOM FUNCTIONS
   */
  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * PAD LEADING
   */
  padLeadingZeros(num): string {
    return String(num).padStart(4, '0');
  }

  /**
   * HANDLE EXTERNAL API CALL ASYNC
   */

  async handleExternalApiCallAsync(
    apiCall: Promise<any>,
    apiName: string,
  ): Promise<any> {
    try {
      const response = await apiCall;
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error in ${apiName} API Call: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  getNYTThumbnail = (doc: any): string | null => {
    if (!doc.multimedia || doc.multimedia.length === 0) return null;
    const image = doc.multimedia.find((media) => media.subtype === 'xlarge');
    const imageUrl = image ? image.url : doc.multimedia[0].url;
    return imageUrl ? `https://www.nytimes.com/${imageUrl}` : null;
  };

  async fetchFromNYT(query?: string): Promise<News[]> {
    const apiKey = this.configService.get<string>('NY_TIMES_KEY');
    const nyApiUrl = this.configService.get<string>('NY_TIMES_URL');

    try {
      const response: AxiosResponse<NYTResponse> = await lastValueFrom(
        this.httpService.get(`${nyApiUrl}?q=${query}&api-key=${apiKey}`),
      );

      // Map the response to the expected News[] format
      const articles: News[] = await Promise.all(
        response.data.response.docs.map(async (article) => {
          let sources = await this.newsSources.findOne({
            title: article.source,
          });

          // If sources doesn't exist, create it
          if (!sources) {
            sources = await this.newsSources.create({
              title: article.source,
            });
          }

          let category = await this.newsCategoryModel.findOne({
            title: article.section_name,
          });

          // If category doesn't exist, create it
          if (!category) {
            category = await this.newsCategoryModel.create({
              title: article.section_name,
            });
          }

          return {
            title: article.headline.main,
            description: article.abstract,
            author: article.byline?.original || 'Unknown',
            content: article.lead_paragraph,
            thumbnail: this.getNYTThumbnail(article),
            category: category._id, // Use the _id from DB
            source: sources._id, // Use the _id from DB
            url: article.web_url,
            publishedAt: new Date(article.pub_date),
          };
        }),
      );

      console.log({articles});

      return articles;
    } catch (error) {
      return []; // Return an empty array on error
    }
  }

  async fetchFromNewsAPI(query?: string): Promise<News[]> {
    const apiKey = this.configService.get<string>('NEWS_API_KEY');
    const newsApiUrl = this.configService.get<string>('NEWS_API_URL');

    try {
      const response: AxiosResponse<NewsAPIResponse> = await lastValueFrom(
        this.httpService.get(`${newsApiUrl}?q=${query}&apiKey=${apiKey}`),
      );

      // Map the response to the expected News[] format
      const articles: News[] = await Promise.all(
        response.data.articles.map(async (article) => {
          let sources = await this.newsSources.findOne({
            title: article.source.name,
          });

          // If category doesn't exist, create it
          if (!sources) {
            sources = await this.newsSources.create({
              title: article.source.name,
            });
          }

          return {
            title: article.title,
            description: article.description,
            author: article.author || 'Unknown',
            content: article.content,
            thumbnail: article.urlToImage || null,
            // category: category._id, // Use the _id from DB
            source: sources._id, // Use the _id from DB
            url: article.url,
            publishedAt: new Date(article.publishedAt), // Ensure proper date format
          };
        }),
      );

      return articles; // Return the mapped articles
    } catch (error) {
      console.error('Error fetching articles:', error);
      return []; // Return an empty array on error
    }
  }
}
