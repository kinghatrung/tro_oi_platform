import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Flex } from 'antd';
import { BedDouble, CircleUserRound, House, Heart, Image as ImageIcon, MapPin } from 'lucide-react';

export function CardItemSearch() {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card
      variant="borderless"
      className="rounded-none! transition-shadow! duration-200! hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)]!"
      classNames={{
        body: 'pt-3! pb-4! px-6!',
      }}
    >
      {/* Breadcrumb / mô tả ngắn */}
      <p className="text-secondary mb-2 text-xs!">
        Nhà đất Quận Đống Đa - Phố Tôn Đức Thắng - 5 tầng - 3PN - 15m² - Nội thất đầy đủ
      </p>

      <Link href="/" className="block">
        <Flex gap={16}>
          {/* Image */}
          <div className="relative h-40 w-40 min-w-40 overflow-hidden rounded-lg">
            <Image
              src="/images/test.jpg"
              alt="Ảnh nhà đất"
              fill
              sizes="160px"
              className="object-cover"
            />

            {/* Overlay */}
            <Flex
              justify="space-between"
              align="center"
              className="absolute right-0 bottom-0 left-0 bg-black/50 px-2! py-1.5!"
            >
              <span className="text-xs! font-semibold text-white">Tin ưu tiên</span>

              <Flex align="center" gap={1}>
                <span className="text-xs! font-semibold text-white">12</span>
                <ImageIcon size={13} className="text-white" />
              </Flex>
            </Flex>
          </div>

          {/* Content */}
          <Flex vertical gap={7} className="min-w-0! flex-1">
            {/* Title + Save */}
            <Flex justify="space-between" align="start" gap={12}>
              <Link href="/" className="min-w-0 flex-1">
                <h3 className="text-default text-[#222] m-0! line-clamp-2 font-semibold leading-5!">
                  Bán nhà ngõ Thịnh Hào 3, Tôn Đức Thắng, gần Văn Miếu, Quốc Tử Giám!
                </h3>
              </Link>

              <Button
                size="small"
                icon={
                  <Heart
                    size={18}
                    className={isFavorite ? 'fill-[#f0325e] stroke-[#f0325e]' : ''}
                  />
                }
                className="shrink-0 text-sm! text-[#222]! rounded-xl! btn-ghost!"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFavorite((prev) => !prev);
                }}
              >
                Lưu
              </Button>
            </Flex>

            {/* Property information */}
            <Flex align="center" gap={12} wrap>
              <Flex align="center" gap={4}>
                <BedDouble size={16} color="#222" />
                <span className="text-secondary text-[#222]">3 PN</span>
              </Flex>

              <Flex align="center" gap={4}>
                <House size={16} color="#222" />
                <span className="text-secondary text-[#222]">3 phòng</span>
              </Flex>

              <Flex align="center" gap={4}>
                <House size={16} color="#222" />
                <span className="text-secondary text-[#222]">Nhà ngõ, hẻm</span>
              </Flex>

              <span className="text-secondary text-[#222]">Đã có sổ</span>
            </Flex>

            {/* Address */}
            <Flex align="center" gap={4}>
              <MapPin size={16} color="#222" />
              <span className="text-secondary text-[#222]">
                Q. Đống Đa (P. Văn Miếu - Quốc Tử Giám)
              </span>
            </Flex>

            {/* Poster */}
            <Flex align="center" gap={8}>
              <div className="flex size-5 items-center justify-center rounded-full bg-yellow-400">
                <CircleUserRound size={15} className="text-white" />
              </div>

              <span className="text-secondary text-[#222]">Cong Dung</span>
              <span className="text-secondary text-sm">Cá nhân · 1 tin</span>
            </Flex>

            {/* Price */}
            <Flex align="center" gap={12}>
              <span className="text-primary text-[#f0325e]">4 tỷ - 15m²</span>

              <span className="text-default font-semibold">267 tr/m²</span>
            </Flex>
          </Flex>
        </Flex>
      </Link>
    </Card>
  );
}
