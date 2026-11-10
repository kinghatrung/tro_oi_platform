'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App, Button, Card, Descriptions, Flex, Image, Tag } from 'antd';
import { Clock, Eye, Flag, Heart, Link2, MapPin } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  ReportTargetType,
  type ProductItem,
} from '@tro-oi/shared';

import { RelativeTime, ReportModal } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { useSaveToggle } from '@/hooks/useSaveToggle';
import { CONDITION_TAG_COLORS } from '@/lib/constants/constantsProduct';
import { recordProductView } from '@/lib/viewHistory';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatVietnameseCurrency } from '@/utils/helpers';

/** Ảnh (bấm để phóng to), giá, thông tin, mô tả của 1 món đồ Chợ ơi. */
export function ProductDetail({ product }: { product: ProductItem }) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isSaved = useAuthStore((state) =>
    state.favoriteProducts.some((item) => item.id === product.id),
  );
  const toggleFavoriteProduct = useAuthStore((state) => state.toggleFavoriteProduct);
  const handleToggleSave = useSaveToggle(
    useCallback(() => toggleFavoriteProduct(product), [product, toggleFavoriteProduct]),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const images = product.images.length > 0 ? product.images : [NO_IMAGE];
  const location = [product.address?.ward ?? product.address?.district, product.address?.city]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    recordProductView(product); // "Đồ bạn đã xem" ở trang Chợ ơi
  }, [product]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success('Đã sao chép liên kết');
    } catch {
      message.error('Không sao chép được, hãy copy từ thanh địa chỉ');
    }
  }, [message]);

  const handleReport = useCallback(() => {
    if (!isLoggedIn) {
      router.push(`/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    setIsReportOpen(true);
  }, [isLoggedIn, pathname, router]);

  return (
    <Flex vertical gap={12}>
      <Card variant="borderless">
        <Image.PreviewGroup items={images}>
          <div className="flex h-100 items-center justify-center overflow-hidden rounded-xl bg-soft">
            <Image
              src={images[activeIndex]}
              alt={product.title}
              className="max-h-100 object-contain"
              rootClassName="flex! justify-center"
            />
          </div>
        </Image.PreviewGroup>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, index) => (
              <button
                key={src + index}
                type="button"
                aria-label={`Ảnh ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={clsx(
                  'size-18 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 p-0',
                  index === activeIndex ? 'border-brand' : 'border-line',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail nhỏ, ảnh đã tối ưu ở ảnh lớn */}
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <h1 className="text-primary mt-4 text-2xl!">{product.title}</h1>
        <Flex align="center" gap={12} wrap className="mt-2!">
          <span className="text-2xl font-bold text-price">
            {product.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(product.price)}
          </span>
          {product.isNegotiable && <Tag color="orange">Có thương lượng</Tag>}
          <Tag color={CONDITION_TAG_COLORS[product.condition]}>
            {PRODUCT_CONDITION_LABELS[product.condition]}
          </Tag>
        </Flex>
        <Flex gap={16} wrap className="mt-3! text-sm text-body">
          <Flex align="center" gap={4}>
            <MapPin size={16} /> {location}
          </Flex>
          <Flex align="center" gap={4}>
            <Clock size={16} /> Đăng <RelativeTime date={product.createdAt} />
          </Flex>
          <Flex align="center" gap={4}>
            <Eye size={16} /> {product.viewCount ?? 0} lượt xem
          </Flex>
        </Flex>
        <Flex gap={8} wrap className="mt-4!">
          <Button
            aria-pressed={isSaved}
            icon={<Heart size={16} className={isSaved ? 'fill-price stroke-price' : ''} />}
            onClick={() => handleToggleSave()}
          >
            {isSaved ? 'Đã lưu' : 'Lưu'}
          </Button>
          <Button icon={<Link2 size={16} />} onClick={handleCopyLink}>
            Sao chép liên kết
          </Button>
          <Button icon={<Flag size={16} />} onClick={handleReport}>
            Báo cáo
          </Button>
        </Flex>
      </Card>

      <Card variant="borderless" title="Thông tin">
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: 'category',
              label: 'Danh mục',
              children: PRODUCT_CATEGORY_LABELS[product.category],
            },
            {
              key: 'condition',
              label: 'Tình trạng',
              children: PRODUCT_CONDITION_LABELS[product.condition],
            },
            { key: 'location', label: 'Khu vực', children: location },
            {
              key: 'negotiable',
              label: 'Thương lượng',
              children: product.isNegotiable ? 'Có' : 'Không',
            },
          ]}
        />
      </Card>

      {product.description && (
        <Card variant="borderless" title="Mô tả">
          <p className="whitespace-pre-line text-default">{product.description}</p>
        </Card>
      )}

      <ReportModal
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType={ReportTargetType.PRODUCT}
        targetId={product.id}
      />
    </Flex>
  );
}
