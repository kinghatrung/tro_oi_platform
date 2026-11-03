import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
} from './report.schema.js';

export class CreateReportDto {
  @IsIn(REPORT_TARGET_TYPES)
  targetType: (typeof REPORT_TARGET_TYPES)[number];

  @IsMongoId({ message: 'Tin không hợp lệ' })
  targetId: string;

  @IsIn(REPORT_REASONS, { message: 'Chọn lý do báo cáo' })
  reason: (typeof REPORT_REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ReportQueryDto {
  @IsOptional()
  @IsIn(REPORT_STATUSES)
  status?: (typeof REPORT_STATUSES)[number];

  @IsOptional()
  @IsIn(REPORT_TARGET_TYPES)
  targetType?: (typeof REPORT_TARGET_TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}

export class UpdateReportDto {
  @IsIn(REPORT_STATUSES)
  status: (typeof REPORT_STATUSES)[number];
}
