/** Theme mặc định của website. */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
}

/** Thiết lập website (singleton) — GET /settings công khai, PUT /admin/settings cho admin. */
export interface SiteSettings {
  /** Tên website, vd "Trọ ơi" — dùng cho tiêu đề tab, logo alt, footer. */
  siteName: string;
  /** Khẩu hiệu ghép sau tên ở tiêu đề trang chủ. */
  tagline: string;
  /** Meta description (SEO). */
  description: string;
  logoUrl: string;
  faviconUrl: string;
  /** Dòng chữ lớn trên banner trang chủ. */
  heroTitle: string;
  /** Màu chủ đạo dạng #RRGGBB. */
  primaryColor: string;
  /** Màu chủ đạo riêng của khu Chợ ơi (/cho-oi/*), dạng #RRGGBB. */
  marketplaceColor: string;
  defaultTheme: ThemeMode;
  /** Cho người dùng tự chuyển sáng/tối. */
  allowThemeToggle: boolean;
  /** Ảnh banner quảng bá trên trang chủ. */
  banners: string[];
  announcementEnabled: boolean;
  announcementText: string;
  announcementType: AnnouncementType;
  contactEmail: string;
  contactPhone?: string;
  footerText: string;
  /** Bật/tắt toàn bộ Chợ ơi. */
  enableMarketplace: boolean;
  /** Tin Trọ ơi mới phải chờ admin duyệt. */
  requireListingApproval: boolean;
  /** Tin Chợ ơi mới phải chờ admin duyệt. */
  requireProductApproval: boolean;
  /** ISO 8601. */
  updatedAt?: string;
}

export type UpdateSiteSettingsRequest = Partial<Omit<SiteSettings, 'updatedAt'>>;
