'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';

export interface BreadcrumbCustomItem {
  title: React.ReactNode;
  href?: string;
}

export interface BreadcrumbItemProps {
  /** Bỏ trống → tự sinh từ URL hiện tại theo ROUTE_LABELS. */
  items?: BreadcrumbCustomItem[];
  className?: string;
  includeHome?: boolean;
  enableJsonLd?: boolean;
}

const DEFAULT_HOME_ITEM: BreadcrumbCustomItem = {
  title: 'Trọ ơi!',
  href: '/',
};

/** Nhãn theo segment URL; `linkable: false` = segment không có trang riêng (vd /phong-tro). */
const ROUTE_LABELS: Record<string, { title: string; linkable?: boolean }> = {
  'tim-kiem': { title: 'Tìm kiếm' },
  'phong-tro': { title: 'Chi tiết tin', linkable: false },
  'nguoi-dung': { title: 'Hồ sơ người đăng', linkable: false },
  'cho-oi': { title: 'Chợ ơi!' },
  'ca-nhan': { title: 'Trang cá nhân' },
  'yeu-thich': { title: 'Tin đã lưu' },
  'dang-tin': { title: 'Đăng tin' },
  'kenh-nguoi-dang': { title: 'Kênh người đăng' },
  'tin-dang': { title: 'Quản lý tin' },
  'tin-nhan': { title: 'Tin nhắn' },
};

/** "/kenh-nguoi-dang/tin-dang" → [Kênh người đăng (link), Quản lý tin]. Segment lạ (id) bị bỏ qua. */
function itemsFromPath(pathname: string): BreadcrumbCustomItem[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.flatMap((segment, index) => {
    const route = ROUTE_LABELS[segment];
    if (!route) return [];
    const isLast = index === segments.length - 1;
    const href = '/' + segments.slice(0, index + 1).join('/');
    return [{ title: route.title, href: isLast || route.linkable === false ? undefined : href }];
  });
}

/** Renders navigation breadcrumbs and optional breadcrumb structured data. */
export function BreadcrumbItem({
  items,
  className = '',
  includeHome = true,
  enableJsonLd = true,
}: BreadcrumbItemProps) {
  const pathname = usePathname();
  const finalCustomItems = items ?? itemsFromPath(pathname);
  const fullItems = includeHome ? [DEFAULT_HOME_ITEM, ...finalCustomItems] : finalCustomItems;

  const antdItems: BreadcrumbProps['items'] = fullItems.map((item) => ({
    title: item.href ? <Link href={item.href}>{item.title}</Link> : item.title,
  }));

  const jsonLd =
    enableJsonLd && fullItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: fullItems.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: typeof item.title === 'string' ? item.title : '',
            item: item.href ? item.href : undefined,
          })),
        }
      : null;

  return (
    <section
      className={`w-full bg-white h-11.5 border-t border-[#e8e8e8] flex items-center ${className}`}
    >
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Breadcrumb className="w-full max-w-300 mx-auto! px-4! py-3!" items={antdItems} />
    </section>
  );
}
