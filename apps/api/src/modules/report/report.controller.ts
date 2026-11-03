import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateReportDto } from './report.dto.js';
import { ReportService } from './report.service.js';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /** Người dùng báo cáo tin vi phạm; admin xử lý ở /admin/reports. */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.reportService.create(user.sub, dto);
  }
}
