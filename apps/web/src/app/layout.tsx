import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { Reddit_Sans } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { cookies } from 'next/headers';
import { ThemeMode, type SiteSettings } from '@tro-oi/shared';

import { loadSiteSettings } from '@/lib/siteSettings';

import { Providers } from './providers';

const redditSans = Reddit_Sans({
  variable: '--font-reddit-sans',
  subsets: ['latin', 'vietnamese'],
});

/** Cookie lưu theme người dùng tự chọn (ghi ở providers.tsx) — đọc ở server để không nháy màu. */
const THEME_COOKIE = 'theme';

/** Theme hiệu lực: lựa chọn của người dùng (nếu admin cho phép) hoặc mặc định của site. */
async function resolveThemeMode(settings: SiteSettings): Promise<ThemeMode> {
  const chosen = (await cookies()).get(THEME_COOKIE)?.value;
  const isValid = chosen === ThemeMode.LIGHT || chosen === ThemeMode.DARK;
  return settings.allowThemeToggle && isValid ? chosen : settings.defaultTheme;
}

/** Tiêu đề, mô tả lấy từ thiết lập website (admin đổi ở /quan-tri/thiet-lap). Favicon ở providers.tsx. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings();
  return {
    title: {
      default: `${settings.siteName}: ${settings.tagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.description,
  };
}

/** Provides the document shell and global UI providers for the application. */
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = await loadSiteSettings();
  const themeMode = await resolveThemeMode(settings);

  return (
    <html
      lang="vi"
      className={`${redditSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      data-theme={themeMode}
      // Màu chủ đạo admin chọn → token CSS --brand (text-brand, bg-brand...)
      style={
        {
          '--brand': settings.primaryColor,
          '--market-brand': settings.marketplaceColor,
        } as CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <Providers settings={settings} initialTheme={themeMode}>
            {settings.announcementEnabled && settings.announcementText && (
              <AnnouncementBar text={settings.announcementText} type={settings.announcementType} />
            )}
            {children}
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
