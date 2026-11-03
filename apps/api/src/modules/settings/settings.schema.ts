import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

// Trùng ThemeMode / AnnouncementType bên @tro-oi/shared (settings.ts)
export const THEME_MODES = ['light', 'dark'] as const;
export const ANNOUNCEMENT_TYPES = ['info', 'warning', 'success'] as const;

/** Giá trị mặc định = giao diện hiện tại của web. */
export const DEFAULT_SETTINGS = {
  siteName: 'Trọ ơi',
  tagline: 'Tìm trọ nhanh chóng, dễ dàng',
  description:
    'Trọ ơi là nền tảng tìm trọ trực tuyến giúp bạn dễ dàng tìm kiếm và thuê phòng trọ, căn hộ, nguyên căn và tìm người ở ghép tại Việt Nam.',
  logoUrl: '/images/tro-oi-logo.svg',
  faviconUrl: '/favicon.svg',
  heroTitle: 'Nhà vừa ý, giá hợp lý!',
  primaryColor: '#16a6a3',
  marketplaceColor: '#ea580c',
  defaultTheme: 'light' as (typeof THEME_MODES)[number],
  allowThemeToggle: true,
  banners: [
    '/images/banner-0.png',
    '/images/banner-1.png',
    '/images/banner-2.png',
    '/images/banner-3.png',
  ],
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info' as (typeof ANNOUNCEMENT_TYPES)[number],
  contactEmail: 'trogiup@trooi.vn',
  contactPhone: '',
  footerText:
    'Trọ Ơi! là dự án cá nhân, không đại diện cho bất kỳ tổ chức, doanh nghiệp hoặc sàn giao dịch bất động sản nào. Thông tin tin đăng do người dùng cung cấp.',
  enableMarketplace: true,
  requireListingApproval: false,
  requireProductApproval: false,
};

export type SettingsValues = typeof DEFAULT_SETTINGS;

/** Một document duy nhất (key = "site"). */
@Schema({ timestamps: true, collection: 'settings' })
export class Setting {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: Object, default: {} })
  values: Partial<SettingsValues>;

  updatedAt: Date;
}

export type SettingDocument = HydratedDocument<Setting>;
export const SettingSchema = SchemaFactory.createForClass(Setting);
