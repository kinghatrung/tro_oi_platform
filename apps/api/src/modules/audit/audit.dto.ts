import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { AUDIT_TARGET_TYPES } from './audit-log.schema.js';

export class AuditLogQueryDto {
  @IsOptional()
  @IsIn(AUDIT_TARGET_TYPES)
  targetType?: (typeof AUDIT_TARGET_TYPES)[number];

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
