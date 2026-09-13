'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Carousel, Space, Button, Dropdown, type MenuProps } from 'antd';
import { ChevronLeft, ChevronRight, EllipsisVertical, Share, Flag, Headphones } from 'lucide-react';
import { FaFacebookF, FaFacebookMessenger, FaLink } from 'react-icons/fa';
import type { CarouselRef } from 'antd/es/carousel';

const images = [
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
];

const items: MenuProps['items'] = [
  {
    key: 'report',
    label: <span className="ml-2 font-medium text-default">Báo cáo tin đăng</span>,
    icon: <Flag size={24} />,
  },
  {
    key: 'help',
    label: <span className="ml-2 font-medium text-default">Cần trợ giúp</span>,
    icon: <Headphones size={24} />,
  },
];

export function PropertyOverview() {
  const carouselRef = useRef<CarouselRef>(null);
  const [current, setCurrent] = useState(0);

  return (
    <section className="rounded-xl bg-white p-5">
      <div className="relative bg-[#222] w-full h-103 rounded-xl overflow-hidden">
        <Carousel ref={carouselRef} dots={false} beforeChange={(_, next) => setCurrent(next)}>
          {images.map((src, i) => (
            <div key={i} className="relative h-103 w-full cursor-zoom-in">
              <Image
                src={src}
                alt={`Ảnh ${i + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 700px"
                priority={i === 0}
              />
            </div>
          ))}
        </Carousel>

        {/* nút điều hướng dùng Button của antd */}
        <Button
          shape="circle"
          icon={<ChevronLeft size={20} />}
          onClick={() => carouselRef.current?.prev()}
          className="absolute! left-3 top-1/2 -translate-y-1/2 z-10 bg-[#22222280]! text-white! shadow-[0_1px_4px_#00000029]! border-none!"
        />

        <Button
          shape="circle"
          icon={<ChevronRight size={20} />}
          onClick={() => carouselRef.current?.next()}
          className="absolute! right-3 top-1/2 -translate-y-1/2 z-10 bg-[#22222280]! text-white! shadow-[0_1px_4px_#00000029]! border-none!"
        />

        <Space align="center" className="absolute top-3 right-3 z-10">
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            popupRender={() => (
              <div className="bg-white rounded-lg shadow-md w-full px-5 py-4">
                <div className="font-bold text-[16px] text-center mb-4">Chia sẻ qua:</div>
                <Space size={16} align="center">
                  <Button className="bg-[#4267B2]!" icon={<FaFacebookF color="#fff" size={20} />} />
                  <Button
                    className="bg-[#168dfb]!"
                    icon={<FaFacebookMessenger color="#fff" size={20} />}
                  />
                  <Button className="bg-[#9AAAB5]!" icon={<FaLink color="#fff" size={20} />} />
                </Space>
              </div>
            )}
          >
            <Button icon={<Share size={18} />} className="w-9! h-9!" />
          </Dropdown>

          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button icon={<EllipsisVertical size={18} />} className="w-9! h-9!" />
          </Dropdown>
        </Space>

        <p className="absolute bottom-5 right-5 text-white text-sm z-10">
          {current + 1} / {images.length}
        </p>
      </div>

      {/* thumbnail strip: vẫn là list thường vì antd Carousel không hỗ trợ nhiều slide/lần */}
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => carouselRef.current?.goTo(i)}
            className={`relative shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 cursor-pointer ${
              current === i ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Image
              src={src}
              alt={`Thumbnail ${i + 1}`}
              fill
              className="object-cover w-[84px]"
              sizes="84px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
