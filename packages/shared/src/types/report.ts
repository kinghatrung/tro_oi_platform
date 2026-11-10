import type { ChatParticipant } from './chat';

/** Loại nội dung bị báo cáo. */
export enum ReportTargetType {
  LISTING = 'listing',
  PRODUCT = 'product',
  REVIEW = 'review',
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

/** Lý do khi báo cáo đánh giá (dùng chung giá trị enum, nhãn riêng cho đánh giá). */
export const REVIEW_REPORT_REASON_LABELS: Partial<Record<ReportReason, string>> = {
  [ReportReason.INAPPROPRIATE]: 'Ngôn từ xúc phạm / không phù hợp',
  [ReportReason.WRONG_INFO]: 'Sai sự thật, bịa đặt',
  [ReportReason.DUPLICATE]: 'Spam, đánh giá lặp lại',
  [ReportReason.OTHER]: 'Khác',
};

/** Nhãn lý do theo loại nội dung bị báo cáo. */
export const reportReasonLabel = (targetType: ReportTargetType, reason: ReportReason) =>
  (targetType === ReportTargetType.REVIEW && REVIEW_REPORT_REASON_LABELS[reason]) ||
  REPORT_REASON_LABELS[reason];

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
  /** Tiêu đề tin / "4★ — lời bình" của đánh giá bị báo cáo (null nếu đã bị xoá). */
  targetTitle: string | null;
  /** Đánh giá: id người được đánh giá (link hồ sơ). */
  targetUserId?: string;
  reason: ReportReason;
  note?: string;
  status: ReportStatus;
  reporter?: ChatParticipant;
  /** ISO 8601. */
  createdAt: string;
}
