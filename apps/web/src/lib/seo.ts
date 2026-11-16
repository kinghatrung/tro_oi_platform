import type { Metadata } from 'next';

/** Địa chỉ công khai của web (canonical, sitemap, og:url). Production đặt NEXT_PUBLIC_SITE_URL lúc build. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

/** Ảnh chia sẻ mặc định — PNG 1200×630 (SVG không hiện trên Facebook / Zalo / Google). */
export const DEFAULT_OG_IMAGE = { url: '/images/og-default.png', width: 1200, height: 630 };

/** Trang cần đăng nhập / quản trị: không cho máy tìm kiếm lập chỉ mục. */
export const NO_INDEX: Metadata = { robots: { index: false, follow: false } };

/**
 * openGraph cho 1 trang. Trang con khai báo openGraph thì GHI ĐÈ cả object của layout gốc
 * → luôn đi qua hàm này để giữ siteName / locale / ảnh dự phòng.
 */
export function buildOpenGraph(
  siteName: string,
  path: string,
  images: string[] = [],
): NonNullable<Metadata['openGraph']> {
  return {
    type: 'website',
    locale: 'vi_VN',
    siteName,
    url: path,
    images: images.length > 0 ? images.slice(0, 1) : [DEFAULT_OG_IMAGE],
  };
}
