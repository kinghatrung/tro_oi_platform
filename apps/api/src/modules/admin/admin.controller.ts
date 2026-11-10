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
import { AuditLogQueryDto } from '../audit/audit.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { UpsertPageDto } from '../page/page.dto.js';
import { PageService } from '../page/page.service.js';
import { ReportQueryDto, UpdateReportDto } from '../report/report.dto.js';
import { ReportService } from '../report/report.service.js';
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
    private readonly auditService: AuditService,
    private readonly pageService: PageService,
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

  /** Tin có toạ độ cho bản đồ quản trị (lọc như /admin/listings, không phân trang). */
  @Get('listings/map')
  listingMap(@Query() query: AdminListingQueryDto) {
    return this.adminService.listingMap(query);
  }

  /** Món có toạ độ cho bản đồ quản trị (lọc như /admin/products, không phân trang). */
  @Get('products/map')
  productMap(@Query() query: AdminProductQueryDto) {
    return this.adminService.productMap(query);
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
  updateReport(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
  ) {
    return this.adminService.updateReport(admin.sub, id, dto);
  }

  @Put('settings')
  updateSettings(
    @CurrentUser() admin: AuthUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.adminService.updateSettings(admin.sub, dto);
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.pageService.getForAdmin(slug);
  }

  @Put('pages/:slug')
  updatePage(
    @CurrentUser() admin: AuthUser,
    @Param('slug') slug: string,
    @Body() dto: UpsertPageDto,
  ) {
    return this.pageService.upsert(admin.sub, slug, dto);
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.list(query);
  }
}
