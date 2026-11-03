import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { IMAGE_URL_PATTERN } from '../listing/dto/listing.dto.js';
import { ANNOUNCEMENT_TYPES, THEME_MODES } from './settings.schema.js';

/** PUT /admin/settings — mọi field tuỳ chọn, chỉ field gửi lên được ghi đè. */
export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Length(2, 40)
  siteName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @Matches(IMAGE_URL_PATTERN, { message: 'URL logo không hợp lệ' })
  logoUrl?: string;

  @IsOptional()
  @Matches(IMAGE_URL_PATTERN, { message: 'URL favicon không hợp lệ' })
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  heroTitle?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Màu chủ đạo phải dạng #RRGGBB' })
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Màu Chợ ơi phải dạng #RRGGBB' })
  marketplaceColor?: string;

  @IsOptional()
  @IsIn(THEME_MODES)
  defaultTheme?: (typeof THEME_MODES)[number];

  @IsOptional()
  @IsBoolean()
  allowThemeToggle?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @Matches(IMAGE_URL_PATTERN, {
    each: true,
    message: 'URL banner không hợp lệ',
  })
  banners?: string[];

  @IsOptional()
  @IsBoolean()
  announcementEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  announcementText?: string;

  @IsOptional()
  @IsIn(ANNOUNCEMENT_TYPES)
  announcementType?: (typeof ANNOUNCEMENT_TYPES)[number];

  @IsOptional()
  @IsEmail({}, { message: 'Email liên hệ không hợp lệ' })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  footerText?: string;

  @IsOptional()
  @IsBoolean()
  enableMarketplace?: boolean;

  @IsOptional()
  @IsBoolean()
  requireListingApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  requireProductApproval?: boolean;
}
