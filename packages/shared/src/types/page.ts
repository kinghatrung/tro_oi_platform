/** Trang nội dung tĩnh — giá trị cũng là URL trên web. Trùng PAGE_SLUGS bên api. */
export enum PageSlug {
  TERMS = 'dieu-khoan-su-dung',
  PRIVACY = 'chinh-sach-bao-mat',
}

/** Khối nội dung do API tách từ văn bản admin soạn (render thành chữ thuần). */
export type ContentBlock =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** GET /pages — trang đã đăng (link chân trang). */
export interface PageSummary {
  slug: PageSlug;
  title: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** GET /pages/:slug */
export interface PublicPage extends PageSummary {
  blocks: ContentBlock[];
}

/** GET / PUT /admin/pages/:slug — văn bản gốc để soạn. */
export interface AdminPage {
  slug: PageSlug;
  title: string;
  /** "" = chưa đăng. */
  content: string;
  /** null = chưa từng lưu. */
  updatedAt: string | null;
}

export interface UpsertPageRequest {
  title: string;
  content: string;
}
