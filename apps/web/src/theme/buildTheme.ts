import { theme as antdTheme, type ThemeConfig } from 'antd';

import { theme as baseTheme } from './antTheme';

const DEFAULT_PRIMARY = '#16a6a3';
const COLOR_VALUE = /^(#|rgb|hsl)/i;
const DEFAULT_PRIMARY_RGBA = /rgba\(22, 166, 163,/;

/**
 * Sắc teal trong antTheme.ts → cách sinh lại từ màu chủ đạo: [màu pha, % màu chủ đạo giữ lại].
 * Chữ/viền xám-teal pha với xám để giữ độ tương phản như bản gốc.
 */
const SHADE_RECIPES: Record<string, [string, number]> = {
  '#16a6a3': ['#000000', 100],
  '#0f8f8c': ['#000000', 85],
  '#087f83': ['#000000', 75],
  '#073b3d': ['#000000', 30],
  '#315b5d': ['#333333', 35],
  '#647f80': ['#707070', 25],
  '#6b8586': ['#757575', 25],
  '#8fa7a8': ['#a0a0a0', 20],
  '#9bb1b2': ['#aaaaaa', 20],
  '#b8e5e2': ['#ffffff', 35],
  '#d5e9e7': ['#e8e8e8', 15],
  '#d9f5f3': ['#ffffff', 20],
  '#e4f1f0': ['#f0f0f0', 10],
  '#eaf8f7': ['#ffffff', 10],
  '#f4fbfa': ['#ffffff', 5],
  '#f8fcfc': ['#ffffff', 3],
};

type Json = string | number | boolean | null | undefined | Json[] | { [key: string]: Json };

const hexToRgb = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

/** Pha `color` với `base`, giữ lại `percent`% của `color`. */
function mixHex(color: string, base: string, percent: number) {
  const baseRgb = hexToRgb(base);
  const channels = hexToRgb(color).map((value, index) =>
    Math.round((value * percent + baseRgb[index] * (100 - percent)) / 100)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`;
}

/** Bỏ mọi giá trị màu (giữ kích thước, bo góc...) — dark mode để darkAlgorithm tự tính màu. */
function withoutColors<TValue extends Json>(value: TValue): TValue {
  if (Array.isArray(value) || value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => !(typeof item === 'string' && COLOR_VALUE.test(item)))
      .map(([key, item]) => [key, withoutColors(item)]),
  ) as TValue;
}

/** Thay dải sắc teal mặc định bằng dải sinh từ màu mới (đệ quy). */
function recolor<TValue extends Json>(value: TValue, color: string): TValue {
  if (typeof value === 'string') {
    const recipe = SHADE_RECIPES[value.toLowerCase()];
    if (recipe) return mixHex(color, recipe[0], recipe[1]) as TValue;
    return value.replace(DEFAULT_PRIMARY_RGBA, `rgba(${hexToRgb(color).join(', ')},`) as TValue;
  }
  if (Array.isArray(value) || value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, recolor(item, color)]),
  ) as TValue;
}

/** Theme AntD theo màu chủ đạo (#RRGGBB) + chế độ sáng/tối. */
export function buildAntTheme(primaryColor: string, isDark: boolean): ThemeConfig {
  const base = baseTheme as unknown as { token: Json; components: Json };

  if (isDark) {
    const components = withoutColors(base.components) as NonNullable<ThemeConfig['components']>;
    return {
      algorithm: antdTheme.darkAlgorithm,
      token: {
        ...(withoutColors(base.token) as ThemeConfig['token']),
        colorPrimary: primaryColor,
        colorLink: primaryColor,
        colorInfo: primaryColor,
      },
      components: {
        ...components,
        // Giữ kiểu "trang hiện tại tô màu chủ đạo" như theme sáng (mặc định dark chỉ có viền)
        Pagination: {
          ...components.Pagination,
          itemActiveBg: primaryColor,
          itemActiveColor: '#fff',
          itemActiveColorHover: '#fff',
        },
      },
    };
  }

  if (primaryColor.toLowerCase() === DEFAULT_PRIMARY) return baseTheme;
  return recolor(base as Json, primaryColor) as ThemeConfig;
}
