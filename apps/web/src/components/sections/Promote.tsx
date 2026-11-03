import Image from 'next/image';
import { Carousel } from 'antd';

import { loadSiteSettings } from '@/lib/siteSettings';

/** Banner quảng bá trang chủ — admin quản lý ở trang thiết lập. */
export async function Promote() {
  const { banners } = await loadSiteSettings();
  if (banners.length === 0) return null;

  return (
    <div className="bg-surface mb-4 rounded-lg">
      <Carousel autoplay draggable className="cursor-pointer">
        {banners.map((src, index) => (
          <div key={src} className="relative h-100">
            <Image
              fill
              src={src}
              alt={`Banner ${index + 1}`}
              sizes="1200px"
              className="rounded-lg object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}
