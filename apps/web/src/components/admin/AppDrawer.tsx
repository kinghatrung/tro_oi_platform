'use client';

import type { ReactNode } from 'react';
import { Drawer, Spin, type DrawerProps } from 'antd';
import { LoaderCircle } from 'lucide-react';

export interface AppDrawerProps extends Omit<DrawerProps, 'title' | 'width' | 'footer'> {
  title?: ReactNode;
  /** Dòng mô tả nhỏ dưới tiêu đề. */
  subtitle?: ReactNode;
  /** Nút phụ góc phải đầu drawer. */
  extraActions?: ReactNode;
  /** Nút Lưu / Huỷ — chân drawer cố định, thân cuộn riêng. */
  footer?: ReactNode;
  loading?: boolean;
}

/**
 * Drawer form/chi tiết dùng chung cho trang quản trị (theo cbs-fe):
 * đầu (tiêu đề + mô tả + thao tác) — thân cuộn có loading — chân chứa nút.
 */
export function AppDrawer({
  title,
  subtitle,
  extraActions,
  footer,
  loading = false,
  size = 560,
  children,
  ...rest
}: AppDrawerProps) {
  return (
    <Drawer
      size={size}
      destroyOnHidden
      title={
        title && (
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-ink">{title}</h3>
            {subtitle && <p className="truncate text-xs font-normal text-subtle">{subtitle}</p>}
          </div>
        )
      }
      extra={extraActions}
      footer={footer && <div className="flex justify-end gap-2">{footer}</div>}
      styles={{
        header: { borderBottom: '1px solid var(--line)' },
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        footer: { borderTop: '1px solid var(--line)', background: 'var(--soft)' },
      }}
      {...rest}
    >
      {/* container của Spin phải co theo chiều cao, nếu không thân không cuộn được */}
      <Spin
        spinning={loading}
        indicator={<LoaderCircle className="animate-spin" />}
        classNames={{ root: 'flex min-h-0 flex-1 flex-col', container: 'min-h-0 flex-1' }}
      >
        <div className="h-full overflow-y-auto p-6">{children}</div>
      </Spin>
    </Drawer>
  );
}
