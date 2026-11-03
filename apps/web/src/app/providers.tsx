'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ConfigProvider, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ThemeMode, type SiteSettings } from '@tro-oi/shared';

import { buildAntTheme } from '@/theme/buildTheme';

const THEME_COOKIE = 'theme';
const ONE_YEAR = 365 * 24 * 60 * 60;

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

  const toggle = useCallback(() => {
    setMode((current) => {
      const next = current === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK;
      document.documentElement.dataset.theme = next;
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
      return next;
    });
  }, []);

  const themeValue = useMemo(
    () => ({ mode, canToggle: settings.allowThemeToggle, toggle }),
    [mode, settings.allowThemeToggle, toggle],
  );

  return (
    <SiteSettingsContext.Provider value={settings}>
      <ThemeContext.Provider value={themeValue}>
        <ConfigProvider locale={viVN} theme={antTheme}>
          {/* globals.css: body:has([data-section='market']) đổi token màu, cả popup gắn vào body */}
          <div data-section={isMarket ? 'market' : undefined} className="contents">
            <AntdApp>{children}</AntdApp>
          </div>
        </ConfigProvider>
      </ThemeContext.Provider>
    </SiteSettingsContext.Provider>
  );
}
