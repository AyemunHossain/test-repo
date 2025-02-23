import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { AdminMetaPermissions } from '../../decorator/admin-permissions.decorator';
import { AdminPermissions } from '../../enum/admin-permission.enum';
import { AdminPermissionGuard } from '../../guards/admin-permission.guard';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { AddNewsDto, FilterAndPaginationNewsDto } from '../../dto/news.dto';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { NewsService } from './news.service';
import { PASSPORT_USER_TOKEN_TYPE } from '../../core/global-variables';
import { AuthGuard } from '@nestjs/passport';

@Controller('news')
export class NewsController {
  private logger = new Logger(NewsController.name);
  constructor(private newsService: NewsService) {}

  /**
   * addNews
   * insertManyNews
   */
  @Post('/add')
  @UsePipes(ValidationPipe)
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  @UseGuards(AdminRolesGuard)
  @AdminMetaPermissions(AdminPermissions.CREATE)
  @UseGuards(AdminPermissionGuard)
  @UseGuards(AdminJwtAuthGuard)
  async addNews(
    @Body()
    addNewsDto: AddNewsDto,
  ): Promise<ResponsePayload> {
    return await this.newsService.addNews(addNewsDto);
  }
  /**
   * getAllNews
   * getNewsById
   */
  @Version(VERSION_NEUTRAL)
  @Post('/get-all')
  @UsePipes(ValidationPipe)
  @UseGuards(AuthGuard(PASSPORT_USER_TOKEN_TYPE))
  async getAllNews(
    @Body() filterNewsDto: FilterAndPaginationNewsDto,
    @Query('q') searchString: string,
  ): Promise<ResponsePayload> {
    return this.newsService.getAllNews(filterNewsDto, searchString);
  }

  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getNewsById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query() select: string,
  ): Promise<ResponsePayload> {
    return await this.newsService.getNewsById(id, select);
  }
}
