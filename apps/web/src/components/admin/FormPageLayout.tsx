'use client';

import type { ReactNode } from 'react';
import { Button, Spin } from 'antd';
import { ArrowLeft, LoaderCircle } from 'lucide-react';

interface FormPageLayoutProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Thao tác phụ góc phải đầu trang. */
  extraActions?: ReactNode;
  /** Nút Lưu / Huỷ — chân trang cố định, thân form cuộn riêng. */
  footer?: ReactNode;
  loading?: boolean;
  /** Có thì hiện nút quay lại bên trái tiêu đề. */
  onBack?: () => void;
  children: ReactNode;
}

/**
 * Trang form dài (thay drawer) — cùng bố cục AppDrawer: đầu trang, thân cuộn, chân cố định.
 * Đặt trực tiếp trong Content của AdminShell (chiếm hết chiều cao).
 */
export function FormPageLayout({
  title,
  subtitle,
  extraActions,
  footer,
  loading = false,
  onBack,
  children,
}: FormPageLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        {onBack && (
          <Button
            type="text"
            icon={<ArrowLeft size={18} />}
            onClick={onBack}
            aria-label="Quay lại"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-xs text-subtle">{subtitle}</p>}
        </div>
        {extraActions}
      </div>

      <Spin
        spinning={loading}
        indicator={<LoaderCircle className="animate-spin" />}
        classNames={{ root: 'flex min-h-0 flex-1 flex-col', container: 'min-h-0 flex-1' }}
      >
        <div className="h-full overflow-y-auto p-6">{children}</div>
      </Spin>

      {footer && (
        <div className="flex justify-end gap-2 border-t border-line bg-surface px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
