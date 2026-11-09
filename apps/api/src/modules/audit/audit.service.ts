import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type { UserDocument } from '../auth/schemas/user.schema.js';
import type { AuditLogQueryDto } from './audit.dto.js';
import {
  AuditLog,
  type AuditLogDocument,
  type AuditTargetType,
} from './audit-log.schema.js';

export interface AuditEntry {
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  targetTitle?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  /** Ghi nhật ký; lỗi chỉ ghi log — thao tác của admin đã xong thì không báo lỗi ngược. */
  async log(actorId: string, entry: AuditEntry) {
    try {
      await this.auditModel.create({ actor: actorId, ...entry });
    } catch (error) {
      this.logger.warn(`Không ghi được nhật ký: ${(error as Error).message}`);
    }
  }

  async list(query: AuditLogQueryDto) {
    const filter = query.targetType ? { targetType: query.targetType } : {};
    const [docs, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .populate('actor', 'name avatar role')
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return {
      items: docs.map((doc) => {
        const actor = doc.actor as unknown as UserDocument | null;
        return {
          id: doc.id as string,
          action: doc.action,
          targetType: doc.targetType,
          targetId: doc.targetId,
          targetTitle: doc.targetTitle,
          actor: actor && {
            id: actor.id as string,
            name: actor.name,
            avatar: actor.avatar,
            role: actor.role,
          },
          createdAt: doc.createdAt.toISOString(),
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
