import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Admin,
  AdminAuthResponse,
  AdminJwtPayload,
} from '../../interfaces/admin/admin.interface';
import { ErrorCodes } from '../../enum/error-code.enum';
import * as bcrypt from 'bcrypt';
import { AuthAdminDto, CreateAdminDto } from '../../dto/admin.dto';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';
import { UtilsService } from '../../shared/utils/utils.service';

@Injectable()
export class AdminService {
  private logger = new Logger(AdminService.name);

  constructor(
    @InjectModel('Admin') private readonly adminModel: Model<Admin>,
    protected jwtService: JwtService,
    private configService: ConfigService,
    private utilsService: UtilsService,
  ) {}

  /**
   * Admin Signup
   * Admin Login
   */
  async adminSignup(createAdminDto: CreateAdminDto): Promise<ResponsePayload> {
    const { password } = createAdminDto;
    const salt = await bcrypt.genSalt();
    const hashedPass = await bcrypt.hash(password, salt);

    const defaultData = {
      password: hashedPass,
      readOnly: false,
      registrationAt: this.utilsService.getDateString(new Date()),
      lastLoggedIn: null,
    };
    const mData = { ...createAdminDto, ...defaultData };
    const newUser = new this.adminModel(mData);
    try {
      const saveData = await newUser.save();
      const data = {
        username: saveData.username,
        name: saveData.name,
        _id: saveData._id,
      };
      return {
        success: true,
        message: 'Registration Success',
        data,
      } as ResponsePayload;
    } catch (error) {
      // console.log(error);
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async adminLogin(authAdminDto: AuthAdminDto): Promise<AdminAuthResponse> {
    try {
      const user = (await this.adminModel
        .findOne({ username: authAdminDto.username })
        .select('password username role permissions hasAccess')) as Admin;

      if (!user) {
        return {
          success: false,
          message: 'Username is invalid',
        } as AdminAuthResponse;
      }

      if (!user.hasAccess) {
        return {
          success: false,
          message: 'No Access for Login',
        } as AdminAuthResponse;
      }

      const isMatch = await bcrypt.compare(
        authAdminDto.password,
        user.password,
      );

      if (isMatch) {
        const payload: AdminJwtPayload = {
          _id: user._id,
          username: user.username,
          role: user.role,
          permissions: user.permissions,
        };
        const accessToken = this.jwtService.sign(payload);
        // Update Login Info
        await this.adminModel.findByIdAndUpdate(user._id, {
          $set: {
            lastLoggedIn: this.utilsService.getDateWithCurrentTime(new Date()),
          },
        });

        return {
          success: true,
          message: 'Login success!',
          data: {
            _id: user._id,
            role: user.role,
            permissions: user.permissions,
          },
          token: accessToken,
          tokenExpiredIn: this.configService.get<number>(
            'adminTokenExpiredTime',
          ),
        } as AdminAuthResponse;
      } else {
        return {
          success: false,
          message: 'Password not matched!',
          data: null,
          token: null,
          tokenExpiredIn: null,
        } as AdminAuthResponse;
      }
    } catch (error) {
      if (error.code && error.code.toString() === ErrorCodes.UNIQUE_FIELD) {
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
