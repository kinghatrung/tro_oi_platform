import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';
import { Flex } from 'antd';
import type { ListingStat } from '@tro-oi/shared';

import { CATEGORIES } from '@/constants';
import { formatNumber } from '@/utils/helpers';

/** Thẻ các loại hình nhà ở kèm tổng số tin đang hiển thị, dẫn tới trang tìm kiếm. */
export function Property({ stats }: { stats: ListingStat[] }) {
  return (
    <div className="bg-surface rounded-lg p-2 mb-4">
      <Flex gap={16} justify="space-between" wrap>
        {CATEGORIES.map((item) => {
          const count = stats
            .filter((stat) => stat.category === item.category)
            .reduce((sum, stat) => sum + stat.count, 0);

          return (
            <Link
              key={item.category}
              href={`/tim-kiem?category=${item.category}`}
              className="group block"
            >
              <Flex
                gap={12}
                justify="center"
                align="center"
                className={clsx(`
                  px-3! py-5!
                  rounded-xl
                  transition-all duration-300 ease-in-out
                  group-hover:bg-gray-50
                  group-hover:shadow-md
                  group-hover:-translate-y-1
                `)}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={88}
                  height={88}
                  className="h-22 w-22 object-fill transition-transform duration-300 ease-in-out group-hover:scale-105"
                />

                <Flex vertical gap={4}>
                  <p className="text-primary">{item.title}</p>
                  <p className="text-secondary">
                    {formatNumber(count)} {item.unit}
                  </p>
                </Flex>
              </Flex>
            </Link>
          );
        })}
      </Flex>
    </div>
  );
}
