import type { BaseListRequest } from './common';

/** Chuyên mục tin tức. */
export enum NewsCategory {
  MARKET = 'market',
  POLICY = 'policy',
  REVIEW = 'review',
  GUIDE = 'guide'
}

/** Nhãn hiển thị tiếng Việt cho NewsCategory. */
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  [NewsCategory.MARKET]: 'Thị trường',
  [NewsCategory.POLICY]: 'Chính sách',
  [NewsCategory.REVIEW]: 'Review khu trọ',
  [NewsCategory.GUIDE]: 'Cẩm nang'
};

/** Bài viết tin tức. */
export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  /** Nội dung rich text (HTML) — FE phải sanitize trước khi render. */
  content?: string;
  category: NewsCategory;
  thumbnail?: string;
  images?: string[];
  authorName?: string;
  viewCount?: number;
  /** ISO 8601 — thời điểm đăng công khai; trống khi chưa publish. */
  publishedAt?: string;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Tham số tìm kiếm/lọc tin tức. */
export interface SearchNewsRequest extends BaseListRequest {
  keyword?: string;
  category?: NewsCategory;
}
