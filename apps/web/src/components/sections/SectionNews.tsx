'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Flex, Space, Tabs, type TabsProps } from 'antd';
import { TransactionType, type Listing, type ListingStat } from '@tro-oi/shared';

import { CarouselItem } from '@/components/common';
import { CATEGORIES } from '@/constants';

import { LocationGrid } from './LocationGrid';

interface SectionNewsProps {
  title?: string;
  /** Tin hiển thị dạng carousel (bỏ qua khi có `stats`). */
  items?: Listing[];
  /** Có stats → hiển thị tab khu vực theo loại hình thay cho carousel. */
  stats?: ListingStat[];
  buttonText?: string;
  buttonHref?: string;
  classButton?: string;
  className?: string;
}

/** Renders either a property carousel or area tabs under a configurable heading. */
export function SectionNews({
  title,
  items = [],
  stats,
  buttonText,
  buttonHref = '/tim-kiem',
  classButton,
  className,
}: SectionNewsProps) {
  const [transaction, setTransaction] = useState(TransactionType.RENT);
  const tabItems = useMemo<TabsProps['items']>(
    () =>
      stats &&
      CATEGORIES.map(({ category, title: label }) => ({
        key: category,
        label,
        children: <LocationGrid stats={stats} category={category} transaction={transaction} />,
      })),
    [stats, transaction],
  );

  return (
    <div className={clsx('bg-white rounded-lg p-5 mb-4', className)}>
      {title && (
        <Flex gap={16} align="center" className="mb-4!">
          <p className="text-primary">{title}</p>
          {stats && (
            <Space size={8}>
              {[TransactionType.RENT, TransactionType.BUY].map((value) => (
                <Button
                  key={value}
                  type={transaction === value ? 'primary' : 'default'}
                  onClick={() => setTransaction(value)}
                >
                  {value === TransactionType.RENT ? 'Cho thuê' : 'Mua bán'}
                </Button>
              ))}
            </Space>
          )}
        </Flex>
      )}

      {stats ? <Tabs items={tabItems} /> : <CarouselItem items={items} />}

      {buttonText && (
        <Link href={buttonHref} className={clsx('mx-auto block w-fit', classButton)}>
          <Button className="w-full">{buttonText}</Button>
        </Link>
      )}
    </div>
  );
}
