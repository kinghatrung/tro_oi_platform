'use client';

import { Button, Tooltip } from 'antd';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '@tro-oi/shared';

import { useThemeMode } from '@/app/providers';

/** Nút chuyển sáng/tối — ẩn khi admin tắt "cho phép đổi theme". */
export function ThemeToggle() {
  const { mode, canToggle, toggle } = useThemeMode();
  if (!canToggle) return null;

  const isDark = mode === ThemeMode.DARK;
  const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return (
    <Tooltip title={label}>
      <Button
        aria-label={label}
        icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
        onClick={toggle}
      />
    </Tooltip>
  );
}
