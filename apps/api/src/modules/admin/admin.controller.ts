import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ReportQueryDto, UpdateReportDto } from '../report/report.dto.js';
import { ReportService } from '../report/report.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { UpdateSettingsDto } from '../settings/update-settings.dto.js';
import {
  AdminListingQueryDto,
  AdminProductQueryDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
} from './admin.dto.js';
import { AdminService } from './admin.service.js';

/**
 * Trang quản trị. Sửa/xoá từng tin dùng PATCH/DELETE /listings/:id, /products/:id
 * (đã cho phép admin), ở đây chỉ có các thao tác riêng của admin.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reportService: ReportService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(admin.sub, id, dto);
  }

  @Get('listings')
  listListings(@Query() query: AdminListingQueryDto) {
    return this.adminService.listListings(query);
  }

  @Get('products')
  listProducts(@Query() query: AdminProductQueryDto) {
    return this.adminService.listProducts(query);
  }

  @Get('reports')
  listReports(@Query() query: ReportQueryDto) {
    return this.reportService.list(query);
  }

  @Patch('reports/:id')
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportService.update(id, dto);
  }

  @Put('settings')
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
