import { Button, Flex, Space, Tabs, type TabsProps } from 'antd';

import { CarouselItem } from '@/components/common';

interface SectionNews {
  title?: string;
  buttonText?: string;
  isArea?: boolean;
}

const items: TabsProps['items'] = [
  {
    key: '1',
    label: 'Phòng trọ',
    children: 'Content of Tab Pane 1',
  },
  {
    key: '2',
    label: 'Căn hộ',
    children: 'Content of Tab Pane 2',
  },
  {
    key: '3',
    label: 'Nguyên căn',
    children: 'Content of Tab Pane 3',
  },
  {
    key: '4',
    label: 'Tìm người ở ghép',
    children: 'Content of Tab Pane 4',
  },
];

export function SectionNews({ title, buttonText, isArea }: SectionNews) {
  const onChange = (key: string) => {
    console.log(key);
  };

  return (
    <div className="bg-white rounded-lg p-5 mb-4">
      <Flex gap={16} align="center" className=" mb-4!">
        <p className="text-primary">{title}</p>
        {isArea && (
          <Space size={8}>
            <Button type="primary">Mua bán</Button>
            <Button>Cho thuê</Button>
          </Space>
        )}
      </Flex>

      {isArea && <Tabs defaultActiveKey="1" items={items} onChange={onChange} />}

      {!isArea && <CarouselItem />}

      {buttonText && <Button className="mx-auto block!">{buttonText}</Button>}
    </div>
  );
}
