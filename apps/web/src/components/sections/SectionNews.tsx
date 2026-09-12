'use client';

import Image from 'next/image';
import { Button, Flex, Space, Tabs, type TabsProps } from 'antd';

import { CarouselItem } from '@/components/common';
import { LocationGrid } from './LocationGrid';

interface SectionNews {
  title?: string;
  buttonText?: string;
  isArea?: boolean;
}

const items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Phòng trọ',
    children: <LocationGrid />,
  },
  {
    key: '2',
    label: 'Căn hộ',
    children: <LocationGrid />,
  },
  {
    key: '3',
    label: 'Nguyên căn',
    children: <LocationGrid />,
  },
  {
    key: '4',
    label: 'Tìm người ở ghép',
    children: <LocationGrid />,
  },
];

export function SectionNews({ title, buttonText, isArea }: SectionNews) {
  const onChange = (key: string) => {
    console.log(key);
  };

  return (
    <div className="bg-white rounded-lg p-5 mb-4">
      {title && (
        <Flex gap={16} align="center" className=" mb-4!">
          <p className="text-primary">{title}</p>
          {isArea && (
            <Space size={8}>
              <Button type="primary">Mua bán</Button>
              <Button>Cho thuê</Button>
            </Space>
          )}
        </Flex>
      )}

      {isArea && <Tabs defaultActiveKey="1" items={items} onChange={onChange} />}

      {!isArea && <CarouselItem />}

      {buttonText && <Button className="mx-auto block!">{buttonText}</Button>}
    </div>
  );
}
