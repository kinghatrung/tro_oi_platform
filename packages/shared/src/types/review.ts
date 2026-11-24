import type { PagedResponse } from './api';
import type { ChatParticipant } from './chat';

/** Chờ duyệt khi admin bật "Duyệt đánh giá trước khi hiển thị". */
export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
}

/** Đánh giá 1 người dùng (1–5 sao). */
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  /** Danh sách công khai chỉ có `approved`; người viết thấy bản `pending` của mình ở /reviews/mine. */
  status: ReviewStatus;
  /** null nếu người viết đã bị xoá. */
  reviewer: ChatParticipant | null;
  /** ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

/** GET /reviews?userId= — kèm điểm trung bình (null khi chưa có đánh giá). */
export interface ReviewPage extends PagedResponse<Review> {
  average: number | null;
  count: number;
}

/** GET /reviews/mine?userId= */
export interface MyReviewStatus {
  /** Đã từng nhắn tin với người này (và không phải chính mình). */
  canReview: boolean;
  review: Review | null;
}

/** GET /admin/reviews — đánh giá chờ duyệt kèm người được đánh giá. */
export interface PendingReview extends Review {
  target: ChatParticipant | null;
}

/** Body PUT /reviews (viết mới hoặc sửa đánh giá của mình). */
export interface UpsertReviewRequest {
  userId: string;
  rating: number;
  comment?: string;
}
