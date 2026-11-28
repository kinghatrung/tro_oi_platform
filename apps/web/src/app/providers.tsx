'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AUTO_THEME, ThemeMode, type SiteSettings } from '@tro-oi/shared';

import { AssistantWidget } from '@/components/assistant/AssistantWidget';
import { msUntilThemeSwitch, themeByClock } from '@/lib/themeClock';
import { buildAntTheme } from '@/theme/buildTheme';

const THEME_COOKIE = 'theme';
const ONE_YEAR = 365 * 24 * 60 * 60;

/** Favicon Chợ ơi: sạp hàng trên nền marketplaceColor. */
const marketFavicon = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/><path d="M14 12H50L56 28a6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0Z" fill="#fff"/><path d="M14 40V52H50V40" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  )}`;

interface ThemeContextValue {
  mode: ThemeMode;
  /** Admin cho phép người dùng tự đổi theme. */
  canToggle: boolean;
  toggle: () => void;
}

const SiteSettingsContext = createContext<SiteSettings | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Thiết lập website (tên, logo, liên hệ, bật/tắt tính năng) cho Client Component. */
export function useSiteSettings() {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error('useSiteSettings phải dùng bên trong <Providers>');
  return settings;
}

export function useThemeMode() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemeMode phải dùng bên trong <Providers>');
  return value;
}

interface ProvidersProps {
  children: React.ReactNode;
  settings: SiteSettings;
  initialTheme: ThemeMode;
}

export function Providers({ children, settings, initialTheme }: ProvidersProps) {
  const [mode, setMode] = useState(initialTheme);
  const isMarket = usePathname().startsWith('/cho-oi');
  const primaryColor = isMarket ? settings.marketplaceColor : settings.primaryColor;
  const antTheme = useMemo(
    // Mỗi theme 1 cssVar.key: giữ chung key thì biến CSS của nút bị cũ khi đổi theme không tải lại trang
    () => ({
      ...buildAntTheme(primaryColor, mode === ThemeMode.DARK),
      cssVar: { key: `theme-${isMarket ? 'market' : 'housing'}-${mode}` },
    }),
    [isMarket, mode, primaryColor],
  );

  const isAuto = settings.defaultTheme === AUTO_THEME;

  const toggle = useCallback(() => {
    setMode((current) => {
      const next = current === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
      document.documentElement.dataset.theme = next;
      // Tự động theo giờ: lựa chọn tay chỉ giữ tới mốc đổi kế tiếp (6:00 / 18:00), sau đó lại theo giờ
      const maxAge = isAuto ? Math.ceil(msUntilThemeSwitch() / 1000) : ONE_YEAR;
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${maxAge}; samesite=lax`;
      return next;
    });
  }, [isAuto]);

  // Tự động theo giờ: tới 6:00 / 18:00 thì đổi ngay trên trang đang mở (không cần tải lại).
  // Tab ngủ thì hẹn giờ trễ → kiểm lại khi quay lại tab.
  useEffect(() => {
    if (!isAuto) return;
    let timer: ReturnType<typeof setTimeout>;
    const sync = () => {
      clearTimeout(timer);
      const hasChoice =
        settings.allowThemeToggle &&
        document.cookie.split('; ').some((item) => item.startsWith(`${THEME_COOKIE}=`));
      if (!hasChoice) {
        const next = themeByClock();
        document.documentElement.dataset.theme = next;
        setMode(next);
      }
      timer = setTimeout(sync, msUntilThemeSwitch() + 1000);
    };
    timer = setTimeout(sync, msUntilThemeSwitch() + 1000);
    const onVisible = () => document.visibilityState === 'visible' && sync();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuto, settings.allowThemeToggle]);

  const themeValue = useMemo(
    () => ({ mode, canToggle: settings.allowThemeToggle, toggle }),
    [mode, settings.allowThemeToggle, toggle],
  );

  return (
    <SiteSettingsContext.Provider value={settings}>
      {/* React đưa thẻ này vào <head>; đặt ở đây để đổi theo khu vực khi chuyển trang */}
      <link
        rel="icon"
        href={isMarket ? marketFavicon(settings.marketplaceColor) : settings.faviconUrl}
      />
      <ThemeContext.Provider value={themeValue}>
        <ConfigProvider locale={viVN} theme={antTheme}>
          {/* globals.css: body:has([data-section='market']) đổi token màu, cả popup gắn vào body */}
          <div data-section={isMarket ? 'market' : undefined} className="contents">
            <AntdApp>
              {children}
              {/* Ở cấp gốc để hội thoại không mất khi chuyển trang */}
              <AssistantWidget />
            </AntdApp>
          </div>
        </ConfigProvider>
      </ThemeContext.Provider>
    </SiteSettingsContext.Provider>
  );
}
