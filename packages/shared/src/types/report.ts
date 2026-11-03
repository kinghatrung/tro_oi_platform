import type { ChatParticipant } from './chat';

/** Loại nội dung bị báo cáo. */
export enum ReportTargetType {
  LISTING = 'listing',
  PRODUCT = 'product',
}

export enum ReportReason {
  SCAM = 'scam',
  WRONG_INFO = 'wrong-info',
  DUPLICATE = 'duplicate',
  UNAVAILABLE = 'unavailable',
  INAPPROPRIATE = 'inappropriate',
  OTHER = 'other',
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.SCAM]: 'Lừa đảo',
  [ReportReason.WRONG_INFO]: 'Sai thông tin (giá, địa chỉ, ảnh)',
  [ReportReason.DUPLICATE]: 'Tin trùng lặp',
  [ReportReason.UNAVAILABLE]: 'Đã cho thuê / đã bán',
  [ReportReason.INAPPROPRIATE]: 'Nội dung không phù hợp',
  [ReportReason.OTHER]: 'Khác',
};

export enum ReportStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.OPEN]: 'Chưa xử lý',
  [ReportStatus.RESOLVED]: 'Đã xử lý',
  [ReportStatus.DISMISSED]: 'Bỏ qua',
};

/** Body POST /reports. */
export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Tiêu đề tin bị báo cáo (null nếu tin đã bị xoá). */
  targetTitle: string | null;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  reporter?: ChatParticipant;
  /** ISO 8601. */
  createdAt: string;
}
