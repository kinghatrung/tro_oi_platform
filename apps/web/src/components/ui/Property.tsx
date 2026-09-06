'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { Flex } from 'antd';

import { CATEGORIES } from '@/constants';

export function Property() {
  return (
    <div className="bg-white rounded-lg p-2">
      <Flex gap={16} justify="space-between">
        {CATEGORIES.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
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
              <img
                src={item.image}
                alt={item.title}
                className={clsx(`
                    h-22 w-22 object-fill
                    transition-transform duration-300 ease-in-out
                    group-hover:scale-105
                `)}
              />

              <Flex vertical gap={4}>
                <p className="text-[#222] font-bold text-lg">{item.title}</p>
                <p className="text-[#8c8c8c] font-medium text-sm">{item.count}</p>
              </Flex>
            </Flex>
          </Link>
        ))}
      </Flex>
    </div>
  );
}
