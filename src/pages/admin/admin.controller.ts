import {
  Body,
  Controller,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthAdminDto, CreateAdminDto } from '../../dto/admin.dto';
import { AdminAuthResponse } from '../../interfaces/admin/admin.interface';
import { ResponsePayload } from '../../interfaces/core/response-payload.interface';

@Controller('admin')
export class AdminController {
  private logger = new Logger(AdminController.name);

  constructor(private adminService: AdminService) {}

  /**
   * Admin Signup
   * Admin Login
   */

  @Post('/signup')
  @UsePipes(ValidationPipe)
  // @AdminMetaRoles(AdminRoles.SUPER_ADMIN)
  // @UseGuards(AdminRolesGuard)
  // @AdminMetaPermissions(AdminPermissions.CREATE)
  // @UseGuards(AdminPermissionGuard)
  // @UseGuards(AdminJwtAuthGuard)
  async adminSignup(
    @Body()
    createAdminDto: CreateAdminDto,
  ): Promise<ResponsePayload> {
    return await this.adminService.adminSignup(createAdminDto);
  }

  @Post('/login')
  @UsePipes(ValidationPipe)
  async adminLogin(
    @Body() authAdminDto: AuthAdminDto,
  ): Promise<AdminAuthResponse> {
    return await this.adminService.adminLogin(authAdminDto);
  }
}
