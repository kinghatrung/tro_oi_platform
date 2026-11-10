'use client';

import { Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Carousel } from 'antd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, EmptyVariant } from './EmptyState';

/** react-slick còn truyền currentSlide/slideCount — chỉ lấy prop hợp lệ cho <button>. */
type ArrowProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'onClick'>;

interface CarouselItemProps<T> {
  items: T[];
  /** Thẻ của 1 phần tử (tin Trọ ơi: CardItem, món Chợ ơi: ProductCard). */
  renderItem: (item: T) => ReactNode;
  emptyText?: string;
}

const ITEMS_PER_SLIDE = 5;

/** Renders the previous-slide control for a property carousel. */
function PrevArrow({ className, style, onClick }: ArrowProps) {
  return (
    <button
      type="button"
      aria-label="Trang trước"
      className={className}
      style={style}
      onClick={onClick}
    >
      <ChevronLeft size={24} className="text-brand" />
    </button>
  );
}

/** Renders the next-slide control for a property carousel. */
function NextArrow({ className, style, onClick }: ArrowProps) {
  return (
    <button
      type="button"
      aria-label="Trang sau"
      className={className}
      style={style}
      onClick={onClick}
    >
      <ChevronRight size={24} className="text-brand" />
    </button>
  );
}

/** Thẻ trong carousel có mũi tên, 5 thẻ mỗi trang. */
export function CarouselItem<T extends { id: string }>({
  items,
  renderItem,
  emptyText = 'Chưa có tin đăng',
}: CarouselItemProps<T>) {
  if (items.length === 0) {
    return <EmptyState variant={EmptyVariant.LISTING} description={emptyText} className="mb-4!" />;
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
            {slide.map((item) => (
              <Fragment key={item.id}>{renderItem(item)}</Fragment>
            ))}
          </div>
        </div>
      ))}
    </Carousel>
  );
}
