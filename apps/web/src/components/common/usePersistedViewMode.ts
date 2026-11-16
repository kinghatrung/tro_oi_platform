'use client';

import { useState } from 'react';

import type { ViewMode } from './HeaderToolbar';
import { useIsClient } from './useIsClient';

const readMode = (key: string): ViewMode | null => {
  try {
    const value = localStorage.getItem(key);
    return value === 'grid' || value === 'list' ? value : null;
  } catch {
    return null; // chế độ riêng tư / chặn storage → dùng mặc định
  }
};

/**
 * Chế độ xem lưới / danh sách, nhớ trên trình duyệt theo `key`.
 * Server và lúc hydrate dùng `fallback` → HTML không lệch; sau đó đọc lựa chọn đã lưu.
 */
export function usePersistedViewMode(key: string, fallback: ViewMode) {
  const isClient = useIsClient();
  const [chosen, setChosen] = useState<ViewMode | null>(null);
  const viewMode = chosen ?? (isClient ? readMode(key) : null) ?? fallback;

  const setViewMode = (mode: ViewMode) => {
    setChosen(mode);
    try {
      localStorage.setItem(key, mode);
    } catch {
      // không lưu được thì vẫn đổi trong phiên hiện tại
    }
  };

  return [viewMode, setViewMode] as const;
}
