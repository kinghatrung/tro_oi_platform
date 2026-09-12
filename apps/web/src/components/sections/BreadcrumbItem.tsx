import React from 'react';
import Link from 'next/link';
import { Breadcrumb } from 'antd';
import type { BreadcrumbProps } from 'antd';

export interface BreadcrumbCustomItem {
  title: React.ReactNode;
  href?: string;
}

export interface BreadcrumbItemProps {
  items?: BreadcrumbCustomItem[];
  slug?: string;
  className?: string;
  includeHome?: boolean;
  enableJsonLd?: boolean;
}

const DEFAULT_HOME_ITEM: BreadcrumbCustomItem = {
  title: 'Trọ ơi!',
  href: '/',
};

export function BreadcrumbItem({
  items,
  slug,
  className = '',
  includeHome = true,
  enableJsonLd = true,
}: BreadcrumbItemProps) {
  // Backward compatibility with legacy `slug` prop
  let finalCustomItems: BreadcrumbCustomItem[] = items || [];
  if (!items && slug) {
    finalCustomItems = [{ title: slug }];
  }

  const fullItems = includeHome ? [DEFAULT_HOME_ITEM, ...finalCustomItems] : finalCustomItems;

  const antdItems: BreadcrumbProps['items'] = fullItems.map((item, index) => {
    const isLast = index === fullItems.length - 1;

    return {
      title: item.href && <Link href={item.href}>{item.title}</Link>,
    };
  });

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
      <Breadcrumb className="w-full max-w-300 mx-auto!" items={antdItems} />
    </section>
  );
}
