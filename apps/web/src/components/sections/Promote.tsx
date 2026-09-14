import Image from 'next/image';
import { Carousel } from 'antd';

/** Displays promotional banners in an autoplay carousel. */
export function Promote() {
  return (
    <div className="bg-white mb-4 rounded-lg">
      <Carousel autoplay draggable className="cursor-pointer">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="relative h-100">
            <Image
              fill
              src={`/images/banner-${index}.png`}
              alt={`Ảnh banner ${index}`}
              className="rounded-lg object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}
