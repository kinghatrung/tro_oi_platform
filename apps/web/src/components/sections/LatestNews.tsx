import { CardItem } from '@/components/common';

import { Button, Flex, Carousel } from 'antd';

const contentStyle: React.CSSProperties = {
  margin: 0,
  height: '160px',
  color: '#fff',
  lineHeight: '160px',
  textAlign: 'center',
  background: '#364d79',
};

export function LatestNews() {
  return (
    <div className="bg-white rounded-lg p-5 mb-4">
      <p className="text-primary mb-4">Tin mua bán mới đăng</p>
      {/* <Carousel arrows infinite={false} className="mb-4">
        <div>
          <h3 style={contentStyle}>1</h3>
        </div>
        <div>
          <h3 style={contentStyle}>2</h3>
        </div>
        <div>
          <h3 style={contentStyle}>3</h3>
        </div>
        <div>
          <h3 style={contentStyle}>4</h3>
        </div>
      </Carousel> */}
      <Flex gap={16} className="mb-4!">
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
        <CardItem />
      </Flex>

      <Button className="mx-auto block!">Xem thêm tin mua bán</Button>
    </div>
  );
}
