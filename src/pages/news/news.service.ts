import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { UtilsService } from '../../shared/utils/utils.service';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import { AddNewsDto, FilterAndPaginationNewsDto } from '../../dto/news.dto';
import { HttpService } from '@nestjs/axios';
import { News } from '../../interfaces/common/news.interface';
const ObjectId = Types.ObjectId;

@Injectable()
export class NewsService {
  private logger = new Logger(NewsService.name);

  constructor(
    @InjectModel('News') private readonly newsModel: Model<News>,
    private configService: ConfigService,
    private utilsService: UtilsService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * addNews
   * insertManyNews
   */
  async addNews(addNewsDto: AddNewsDto): Promise<ResponsePayload> {
    const { title } = addNewsDto;

    const defaultData = {
      slug: this.utilsService.transformToSlug(title),
    };
    const mData = { ...addNewsDto, ...defaultData };
    const newData = new this.newsModel(mData);
    try {
      const saveData = await newData.save();
      const data = {
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Data Added Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Slug Must be Unique');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }

  /**
   * getAllNews
   * getNewsById
   */
  async getAllNews(
    filterNewsDto: FilterAndPaginationNewsDto,
    searchQuery?: string,
  ): Promise<ResponsePayload> {
    const { filter } = filterNewsDto;
    const { pagination } = filterNewsDto;
    const { sort } = filterNewsDto;
    const { select } = filterNewsDto;

    // Essential Variables
    const aggregateStages = [];
    let mFilter = {};
    let mSort = {};
    let mSelect = {};
    let mPagination = {};

    // Match

    if (filter && filter['publishedAt']) {
      const startOfDay = new Date(filter['publishedAt']);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1);

      filter['publishedAt'] = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    if (filter && filter['category']) {
      mFilter['category'] = new ObjectId(filter['category']);
    }

    if (filter && filter['source']) {
      mFilter['source'] = new ObjectId(filter['source']);
    }

    if (filter) {
      // if publishedAt is provided, then filter the news based on the publishedAt date
      mFilter = { ...filter, ...mFilter };
    }
    if (searchQuery) {
      mFilter = { ...mFilter, ...{ title: new RegExp(searchQuery, 'i') } };
    }
    // Sort
    if (sort) {
      mSort = sort;
    } else {
      mSort = { publishedAt: -1 };
    }

    // Select
    if (select) {
      mSelect = { ...select };
    } else {
      mSelect = { title: 1 };
    }

    // Finalize
    if (Object.keys(mFilter).length) {
      aggregateStages.push({ $match: mFilter });
    }

    if (Object.keys(mSort).length) {
      aggregateStages.push({ $sort: mSort });
    }

    if (!pagination) {
      aggregateStages.push({ $project: mSelect });
    }

    // Pagination
    if (pagination) {
      if (Object.keys(mSelect).length) {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
              { $project: mSelect },
            ],
          },
        };
      } else {
        mPagination = {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              {
                $skip: pagination.pageSize * pagination.currentPage,
              } /* IF PAGE START FROM 0 OR (pagination.currentPage - 1) IF PAGE 1*/,
              { $limit: pagination.pageSize },
            ],
          },
        };
      }

      aggregateStages.push(mPagination);

      aggregateStages.push({
        $project: {
          data: 1,
          count: { $arrayElemAt: ['$metadata.total', 0] },
        },
      });
    }

    console.log(JSON.stringify(aggregateStages));

    try {
      const dataAggregates = await this.newsModel.aggregate(aggregateStages);
      if (pagination) {
        return {
          ...{ ...dataAggregates[0] },
          ...{ success: true, message: 'Success' },
        } as ResponsePayload;
      } else {
        return {
          data: dataAggregates,
          success: true,
          message: 'Success',
          count: dataAggregates.length,
        } as ResponsePayload;
      }
    } catch (err) {
      this.logger.error(err);
      if (err.code && err.code.toString() === ErrorCodes.PROJECTION_MISMATCH) {
        throw new BadRequestException('Error! Projection mismatch');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getNewsById(id: string, select: string): Promise<ResponsePayload> {
    try {
      const data = await this.newsModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
