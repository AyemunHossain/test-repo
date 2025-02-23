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
import { UserService } from './user.service';
import { User, UserAuthResponse } from '../../interfaces/user/user.interface';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../../decorator/get-user.decorator';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import {
  AuthUserDto,
  CreateUserDto,
  UserSelectFieldDto,
} from '../../dto/user.dto';
import { MongoIdValidationPipe } from '../../pipes/mongo-id-validation.pipe';
import { AdminJwtAuthGuard } from '../../guards/admin-jwt-auth.guard';
import { AdminMetaRoles } from '../../decorator/admin-roles.decorator';
import { AdminRoles } from '../../enum/admin-roles.enum';
import { AdminRolesGuard } from '../../guards/admin-roles.guard';
import { PASSPORT_USER_TOKEN_TYPE } from '../../core/global-variables';

@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(private usersService: UserService) {}

  /**
   * User Login
   * User Signup & Login
   */
  @Post('/login')
  @UsePipes(ValidationPipe)
  async userLogin(@Body() authUserDto: AuthUserDto): Promise<UserAuthResponse> {
    return await this.usersService.userLogin(authUserDto);
  }

  @Post('/signup-and-login')
  @UsePipes(ValidationPipe)
  async userSignupAndLogin(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserAuthResponse> {
    return await this.usersService.userSignupAndLogin(createUserDto);
  }

  /**
   * Logged-in User Info
   */
  @Version(VERSION_NEUTRAL)
  @Get('/logged-in-user-data')
  @UseGuards(AuthGuard(PASSPORT_USER_TOKEN_TYPE))
  async getLoggedInUserData(
    @Query(ValidationPipe) userSelectFieldDto: UserSelectFieldDto,
    @GetUser() user: User,
  ): Promise<ResponsePayload> {
    return this.usersService.getLoggedInUserData(user, userSelectFieldDto);
  }

  /**
   * Get User by ID
   */
  @Version(VERSION_NEUTRAL)
  @Get('/:id')
  @AdminMetaRoles(AdminRoles.SUPER_ADMIN, AdminRoles.ADMIN, AdminRoles.EDITOR)
  @UseGuards(AdminRolesGuard)
  @UseGuards(AdminJwtAuthGuard)
  async getUserById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Query(ValidationPipe) userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    return await this.usersService.getUserById(id, userSelectFieldDto);
  }
}
