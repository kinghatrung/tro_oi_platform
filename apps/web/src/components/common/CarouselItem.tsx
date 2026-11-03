'use client';

import { Carousel } from 'antd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Listing } from '@tro-oi/shared';

import { CardItem } from './CardItem';
import { EmptyState, EmptyVariant } from './EmptyState';

interface ArrowProps {
  currentSlide?: number;
  slideCount?: number;
  [key: string]: unknown;
}

interface CarouselItemProps {
  items: Listing[];
}

const ITEMS_PER_SLIDE = 5;

/** Renders the previous-slide control for a property carousel. */
function PrevArrow({ currentSlide, slideCount, ...props }: ArrowProps) {
  return (
    <button type="button" aria-label="Trang trước" {...props}>
      <ChevronLeft size={24} className="text-brand" />
    </button>
  );
}

/** Renders the next-slide control for a property carousel. */
function NextArrow({ currentSlide, slideCount, ...props }: ArrowProps) {
  return (
    <button type="button" aria-label="Trang sau" {...props}>
      <ChevronRight size={24} className="text-brand" />
    </button>
  );
}

/** Displays property cards in a navigable carousel, 5 cards per slide. */
export function CarouselItem({ items }: CarouselItemProps) {
  if (items.length === 0) {
    return (
      <EmptyState variant={EmptyVariant.LISTING} description="Chưa có tin đăng" className="mb-4!" />
    );
  }

  const slides = Array.from({ length: Math.ceil(items.length / ITEMS_PER_SLIDE) }, (_, index) =>
    items.slice(index * ITEMS_PER_SLIDE, (index + 1) * ITEMS_PER_SLIDE),
  );

  return (
    <Carousel
      className="mb-4"
      arrows={slides.length > 1}
      infinite={false}
      prevArrow={<PrevArrow />}
      nextArrow={<NextArrow />}
    >
      {slides.map((slide, index) => (
        <div key={index}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {slide.map((listing) => (
              <CardItem key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      ))}
    </Carousel>
  );
}
