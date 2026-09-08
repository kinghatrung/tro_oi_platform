import Image from 'next/image';
import { Carousel } from 'antd';

export function Promote() {
  return (
    <div className="bg-white mb-4 rounded-lg">
      <Carousel autoplay draggable className="cursor-pointer">
        {Array.from({ length: 5 }).map((_, index) => (
          <Image
            key={index}
            width={1200}
            height={300}
            className="object-contain rounded-lg"
            alt="Ảnh banner"
            src="/images/banner.png"
          />
        ))}
      </Carousel>
    </div>
  );
}
