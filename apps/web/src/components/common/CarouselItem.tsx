import { Flex, Carousel } from 'antd';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { CardItem } from '@/components/common';

export function CarouselItem() {
  return (
    <Carousel
      className="mb-4"
      arrows
      infinite={false}
      prevArrow={
        <button>
          <ChevronLeft size={24} color="#16a6a3" />
        </button>
      }
      nextArrow={
        <button>
          <ChevronRight size={24} color="#16a6a3" />
        </button>
      }
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <Flex gap={16}>
            {Array.from({ length: 5 }).map((_, index) => (
              <CardItem
                title="Giảm 300tr- 30M2 3 tầng hẻm xe hơi - Emart 2 Sổ mới 2026"
                price={3350000000}
                countMedia={5}
                bedrooms={3}
                propertyType="Chung cư"
                mainDirection="Đông Nam"
                pricePerSquareMeter={111670000}
                timeAgo="2026-09-07T09:00:00+07:00"
                area={30}
                address="Hà Nội"
              />
            ))}
          </Flex>
        </div>
      ))}
    </Carousel>
  );
}
