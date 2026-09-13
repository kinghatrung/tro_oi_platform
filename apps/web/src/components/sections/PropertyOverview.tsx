'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Carousel, Space, Button, Dropdown, Flex, type MenuProps } from 'antd';
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Share,
  Flag,
  Headphones,
  Heart,
  Clock,
} from 'lucide-react';
import { FaFacebookF, FaFacebookMessenger, FaLink } from 'react-icons/fa';
import type { CarouselRef } from 'antd/es/carousel';

const images = [
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);
  }, []);

  useEffect(() => {
    checkScrollPosition(); // check ngay khi mount (phòng trường hợp ảnh ít, không cần cuộn)
  }, [checkScrollPosition]);

  // Tự cuộn thumbnail strip tới ảnh đang active
  useEffect(() => {
    thumbRefs.current[current]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [current]);

  const scrollThumbs = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  return (
    <Flex vertical gap={12}>
      <section className="rounded-xl bg-white">
        <div className="p-5">
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
                      <Button
                        className="bg-[#4267B2]!"
                        icon={<FaFacebookF color="#fff" size={20} />}
                      />
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

          {/* thumbnail strip: flex cuộn ngang + 2 nút Button antd để cuộn */}
          <div className="relative mt-3">
            {!atStart && (
              <Button
                shape="circle"
                icon={<ChevronLeft size={16} />}
                onClick={() => scrollThumbs('left')}
                className="absolute! left-0 top-1/2 -translate-y-1/2 z-10 shadow-md!"
              />
            )}

            <div
              ref={scrollRef}
              onScroll={checkScrollPosition}
              className="flex gap-2 overflow-x-auto scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {images.map((src, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  onClick={() => carouselRef.current?.goTo(i)}
                  className={`relative shrink-0 w-22 h-22 rounded-md overflow-hidden border-2 cursor-pointer ${
                    current === i ? 'border-[#16a6a3]' : 'border-transparent'
                  }`}
                >
                  <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>

            {!atEnd && (
              <Button
                shape="circle"
                icon={<ChevronRight size={16} />}
                onClick={() => scrollThumbs('right')}
                className="absolute! right-0 top-1/2 -translate-y-1/2 z-10 shadow-md!"
              />
            )}
          </div>
        </div>

        <div className="pb-4 px-5">
          <Flex gap={4}>
            <p className="text-primary text-2xl!">
              Studio Full Nội Thất 25m² – Gần Bệnh Viện E – Vào Ở Ngay
            </p>
            <Button icon={<Heart size={24} />} className="text-[16px]! text-[#222]! font-bold!">
              Lưu
            </Button>
          </Flex>

          <Flex gap={16} align="center" className="mt-2!">
            <p className="text-primary text-[#f0325e] text-2xl!">3,2 triệu/tháng</p>
            <p className="text-default font-bold">25 m²</p>
          </Flex>

          <Space align="center" size={8} className="mt-3">
            <Clock size={20} />
            <p className="text-[#222]">Cập nhật 1 ngày trước</p>
          </Space>
        </div>
      </section>

      <section className="rounded-xl bg-white">
        <div className="p-5">
          <p></p>
          <Flex gap={8} vertical>
            <Flex justify="space-between">
              <Flex vertical gap={2}>
                <p className="text-[#222] text-sm">
                  số 104A ngõ 381 , Đường Nguyễn Khang, Phường Yên Hoà, Quận Cầu Giấy, Hà Nội
                </p>
                <p className="text-[#8c8c8c] text-sm">(Phường Yên Hòa, TP Hà Nội mới)</p>
              </Flex>

              <Image
                src="/images/test.jpg"
                alt="Ảnh bản đồ địa chỉ"
                height={52}
                width={52}
                className="object-cover rounded-lg"
              />
            </Flex>
            <Flex gap={12} className="w-full">
              <div className="bg-[#f7f7f7] w-full rounded-xl px-4 py-3">
                <p className="text-xs text-[#222] font-bold">Tổng quan khu vực</p>
                <p className="text-xs text-[#222] font-medium mt-2">
                  Chưa có đánh giá nào cho khu vực này.
                </p>
              </div>

              <div className="bg-[#f7f7f7] w-full rounded-xl px-4 py-3">
                <p className="text-xs text-[#222] font-bold">Tổng quan khu vực</p>
                <p className="text-xs text-[#222] font-medium mt-2">
                  Chưa có đánh giá nào cho khu vực này.
                </p>
              </div>
            </Flex>
            <Flex gap={12} className="w-full">
              <Button className="w-full!">Xem tổng quan khu vực</Button>
              <Button className="w-full!">Hỏi thêm người đăng</Button>
            </Flex>
          </Flex>
        </div>
      </section>
    </Flex>
  );
}
