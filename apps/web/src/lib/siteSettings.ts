import { cache } from 'react';
import { AnnouncementType, ThemeMode, type SiteSettings } from '@tro-oi/shared';

import { getSiteSettings } from '@/api/settings';

/** Dự phòng khi API không phản hồi (giống DEFAULT_SETTINGS bên API) — site vẫn hiển thị được. */
export const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'Trọ ơi',
  tagline: 'Tìm trọ nhanh chóng, dễ dàng',
  description: 'Trọ ơi là nền tảng tìm trọ trực tuyến tại Việt Nam.',
  logoUrl: '/images/tro-oi-logo.svg',
  faviconUrl: '/favicon.svg',
  heroTitle: 'Nhà vừa ý, giá hợp lý!',
  primaryColor: '#16a6a3',
  marketplaceColor: '#ea580c',
  defaultTheme: ThemeMode.LIGHT,
  allowThemeToggle: true,
  banners: [],
  announcementEnabled: false,
  announcementText: '',
  announcementType: AnnouncementType.INFO,
  contactEmail: 'trogiup@trooi.vn',
  footerText: '',
  enableMarketplace: true,
  requireListingApproval: false,
  requireProductApproval: false,
};

/** Thiết lập website cho Server Component — cache theo request (layout + page dùng chung 1 lần gọi). */
export const loadSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await getSiteSettings();
  } catch (error) {
    console.error('Không tải được thiết lập website, dùng mặc định:', error);
    return FALLBACK_SETTINGS;
  }
});
