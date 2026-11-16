import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/seo';

/** robots.txt — chặn khu cần đăng nhập (các trang đó cũng có noindex). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/quan-tri',
        '/kenh-nguoi-dang',
        '/tin-nhan',
        '/ca-nhan',
        '/dang-tin',
        '/thong-bao',
        '/yeu-thich',
        '/cho-oi/dang-ban',
        '/dang-nhap',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
