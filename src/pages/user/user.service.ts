import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  User,
  UserAuthResponse,
  UserJwtPayload,
} from '../../interfaces/user/user.interface';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { ErrorCodes } from '../../enum/error-code.enum';

import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import {
  AuthUserDto,
  CreateUserDto,
  UserSelectFieldDto,
} from '../../dto/user.dto';
import { AdminAuthResponse } from '../../interfaces/admin/admin.interface';
import { UtilsService } from '../../shared/utils/utils.service';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    protected jwtService: JwtService,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * User Login
   * User Signup & Login
   */
  async userLogin(authUserDto: AuthUserDto): Promise<UserAuthResponse> {
    try {
      const user = (await this.userModel
        .findOne({ username: authUserDto.username })
        .select('password username hasAccess')) as User;

      if (!user) {
        return {
          success: false,
          message: 'Username is invalid',
        } as UserAuthResponse;
      }

      if (!user.hasAccess) {
        return {
          success: false,
          message: 'No Access for Login',
        } as AdminAuthResponse;
      }

      const isMatch = await bcrypt.compare(authUserDto.password, user.password);

      if (isMatch) {
        const payload: UserJwtPayload = {
          _id: user._id,
          username: user.username,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
          success: true,
          message: 'Login success!',
          data: {
            _id: user._id,
          },
          token: accessToken,
          tokenExpiredIn: this.configService.get<number>(
            'userTokenExpiredTime',
          ),
        } as UserAuthResponse;
      } else {
        return {
          success: false,
          message: 'Password not matched!',
          data: null,
          token: null,
          tokenExpiredIn: null,
        } as UserAuthResponse;
      }
    } catch (error) {
      this.logger.error(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async userSignupAndLogin(
    createUserDto: CreateUserDto,
  ): Promise<UserAuthResponse> {
    const { password } = createUserDto;
    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(password, salt);

    const mData = {
      ...createUserDto,
      ...{ password: hashedPass },
      hasAccess: true,
    };
    const newUser = new this.userModel(mData);
    try {
      const saveData = await newUser.save();
      const authUserDto: AuthUserDto = {
        username: saveData.username,
        password: password,
      };

      return this.userLogin(authUserDto);
    } catch (error) {
      console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Logged-in User Info
   */
  async getLoggedInUserData(
    user: User,
    selectQuery: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = selectQuery;
      if (!select) {
        select = '-password';
      }
      const data = await this.userModel.findById(user._id).select(select);
      return {
        data,
        success: true,
      } as ResponsePayload;
    } catch (err) {
      this.logger.error(`${user.username} is failed to retrieve data`);
      // console.log(err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Get User by ID
   */

  async getUserById(
    id: string,
    userSelectFieldDto: UserSelectFieldDto,
  ): Promise<ResponsePayload> {
    try {
      let { select } = userSelectFieldDto;
      if (!select) {
        select = '-password';
      }
      const data = await this.userModel.findById(id).select(select);
      return {
        success: true,
        message: 'Success',
        data,
      } as ResponsePayload;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
