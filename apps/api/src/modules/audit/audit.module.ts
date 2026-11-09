import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditLog, AuditLogSchema } from './audit-log.schema.js';
import { AuditService } from './audit.service.js';

/** Nhật ký thao tác admin. Đọc qua GET /admin/audit-logs (AdminController). */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
