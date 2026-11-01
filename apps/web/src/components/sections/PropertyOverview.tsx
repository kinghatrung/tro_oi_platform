'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  App,
  Carousel,
  Space,
  Button,
  Flex,
  Card,
  Col,
  Divider,
  Row,
  Modal,
  type MenuProps,
} from 'antd';
import {
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Share,
  Flag,
  Headphones,
  Heart,
  Clock,
  MapPin,
  Map as MapIcon,
} from 'lucide-react';
import { FaFacebookF, FaLink } from 'react-icons/fa';
import type { CarouselRef } from 'antd/es/carousel';
import { PROPERTY_CATEGORY_LABELS, USER_ROLE_LABELS, type Listing } from '@tro-oi/shared';

import { LocationMap, ButtonDropdown, ImageLightbox } from '@/components/common';
import { buildPropertyFeatures, SAMPLE_QUESTIONS } from '@/lib/constants/constantsRoom';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatListingPrice, formatRelativeTime } from '@/utils/helpers';

interface PropertyOverviewProps {
  listing: Listing;
  similarListings?: Listing[];
}

const SUPPORT_EMAIL = 'trogiup@trooi.vn';

const moreItems: MenuProps['items'] = [
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

/** Displays a property's gallery, key details, description, and map. */
export function PropertyOverview({ listing, similarListings = [] }: PropertyOverviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const carouselRef = useRef<CarouselRef>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isFavorite = useAuthStore((state) =>
    state.favorites.some((item) => item.id === listing.id),
  );
  const toggleFavorite = useAuthStore((state) => state.toggleFavorite);

  const images = listing.images.length > 0 ? listing.images : ['/images/test.jpg'];
  const priceLabel = formatListingPrice(listing.price, listing.transaction);
  const geo = listing.address?.geo;
  const features = useMemo(() => buildPropertyFeatures(listing), [listing]);
  const lightboxSimilar = useMemo(
    () =>
      similarListings.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.images[0],
        bedrooms: item.bedrooms,
        propertyType: PROPERTY_CATEGORY_LABELS[item.category],
        priceLabel: formatListingPrice(item.price, item.transaction),
        address: item.address?.fullAddress,
      })),
    [similarListings],
  );
  const agent = useMemo(
    () =>
      listing.author && {
        name: listing.author.name,
        avatar: listing.author.avatar,
        statusText: listing.author.role && USER_ROLE_LABELS[listing.author.role],
        phone: listing.author.phone,
        profileUrl: `/nguoi-dung/${listing.author.id}`,
      },
    [listing.author],
  );

  const checkScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth);
  }, []);

  const scrollThumbs = useCallback((dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (!isLoggedIn) {
      router.push(`/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    try {
      await toggleFavorite(listing);
    } catch (error) {
      message.error((error as Error).message);
    }
  }, [isLoggedIn, listing, message, pathname, router, toggleFavorite]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success('Đã sao chép liên kết');
    } catch {
      message.error('Không sao chép được, hãy copy từ thanh địa chỉ');
    }
  }, [message]);

  const handleShareFacebook = useCallback(() => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  const handleMoreClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      const subject = key === 'report' ? `Báo cáo tin đăng ${listing.id}` : 'Cần trợ giúp';
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    },
    [listing.id],
  );

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

  return (
    <Flex vertical gap={12}>
      <Card variant="borderless">
        <div className="relative bg-[#222] w-full h-103 rounded-xl overflow-hidden">
          <Carousel ref={carouselRef} dots={false} beforeChange={(_, next) => setCurrent(next)}>
            {images.map((src, i) => (
              <div
                key={i}
                onClick={() => {
                  setLightboxIndex(i);
                  setIsLightboxOpen(true);
                }}
                className="relative h-103 w-full cursor-zoom-in"
              >
                <Image
                  src={src}
                  alt={`${listing.title} - ảnh ${i + 1}`}
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
            aria-label="Ảnh trước"
            icon={<ChevronLeft size={20} />}
            onClick={() => carouselRef.current?.prev()}
            className="absolute! left-3 top-1/2 -translate-y-1/2 z-10 bg-[#22222280]! text-white! shadow-[0_1px_4px_#00000029]! border-none!"
          />

          <Button
            shape="circle"
            aria-label="Ảnh sau"
            icon={<ChevronRight size={20} />}
            onClick={() => carouselRef.current?.next()}
            className="absolute! right-3 top-1/2 -translate-y-1/2 z-10 bg-[#22222280]! text-white! shadow-[0_1px_4px_#00000029]! border-none!"
          />

          <Space align="center" className="absolute top-3 right-3 z-10">
            <ButtonDropdown
              aria-label="Chia sẻ"
              iconButton={<Share size={18} />}
              className="w-9! h-9!"
              popupRender={() => (
                <div className="bg-white rounded-lg shadow-md w-full px-5 py-4">
                  <div className="font-bold text-[16px] text-center mb-4">Chia sẻ qua:</div>
                  <Space size={16} align="center">
                    <Button
                      aria-label="Chia sẻ Facebook"
                      className="bg-[#4267B2]!"
                      icon={<FaFacebookF color="#fff" size={20} />}
                      onClick={handleShareFacebook}
                    />
                    <Button
                      aria-label="Sao chép liên kết"
                      className="bg-[#9AAAB5]!"
                      icon={<FaLink color="#fff" size={20} />}
                      onClick={handleCopyLink}
                    />
                  </Space>
                </div>
              )}
            />

            <ButtonDropdown
              aria-label="Tùy chọn khác"
              placement="bottomRight"
              menus={moreItems}
              onMenuClick={handleMoreClick}
              className="w-9! h-9!"
              iconButton={<EllipsisVertical size={18} />}
            />
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
              aria-label="Cuộn trái"
              icon={<ChevronLeft size={16} />}
              onClick={() => scrollThumbs('left')}
              className="absolute! left-0 top-1/2 -translate-y-1/2 z-10 shadow-md!"
            />
          )}

          <div
            ref={scrollRef}
            onScroll={checkScrollPosition}
            className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none]"
          >
            {images.map((src, i) => (
              <div
                key={i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => carouselRef.current?.goTo(i)}
                className={`relative shrink-0 w-22 h-22 rounded-md overflow-hidden border-2 cursor-pointer ${
                  current === i ? 'border-[#16a6a3]' : 'border-[#efefef]'
                }`}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {!atEnd && (
            <Button
              shape="circle"
              aria-label="Cuộn phải"
              icon={<ChevronRight size={16} />}
              onClick={() => scrollThumbs('right')}
              className="absolute! right-0 top-1/2 -translate-y-1/2 z-10 shadow-md!"
            />
          )}
        </div>

        <div className="pt-4">
          <Flex gap={4} justify="space-between" align="start">
            <h1 className="text-primary text-2xl!">{listing.title}</h1>
            <Button
              aria-pressed={isFavorite}
              icon={
                <Heart size={24} className={isFavorite ? 'fill-[#f0325e] stroke-[#f0325e]' : ''} />
              }
              className="text-[16px]! text-[#222]! font-bold!"
              onClick={handleToggleFavorite}
            >
              {isFavorite ? 'Đã lưu' : 'Lưu'}
            </Button>
          </Flex>

          <Flex gap={16} align="center" className="mt-2!">
            <p className="text-primary text-[#f0325e] text-2xl!">{priceLabel}</p>
            {listing.area != null && <p className="text-default font-bold">{listing.area} m²</p>}
          </Flex>

          <Space align="center" size={8} className="mt-3">
            <Clock size={20} />
            <p className="text-[#222]">Cập nhật {formatRelativeTime(listing.updatedAt)}</p>
          </Space>
        </div>
      </Card>

      <Card variant="borderless">
        <p className="text-primary mb-2">Địa chỉ</p>
        <Flex justify="space-between" align="center" gap={12}>
          <Flex gap={8} align="start">
            <MapPin size={18} className="mt-0.5 shrink-0" />
            <p className="text-[#222] text-sm">{listing.address?.fullAddress}</p>
          </Flex>

          {geo && (
            <Button icon={<MapIcon size={16} />} onClick={() => setIsMapOpen(true)}>
              Xem bản đồ
            </Button>
          )}
        </Flex>
      </Card>

      <Card variant="borderless">
        <p className="text-primary mb-2">Đặc điểm bất động sản</p>

        <div className="mt-1">
          {features.map((item, index) => (
            <div key={item.label}>
              <Row align="middle" className="min-h-10">
                <Col xs={12} md={8} lg={8}>
                  <Flex align="center" gap={12} className="text-[#333]!">
                    <span className="flex shrink-0 items-center">{item.icon}</span>
                    <p className="text-default">{item.label}</p>
                  </Flex>
                </Col>

                <Col xs={12} md={16} lg={16}>
                  <p className="text-default font-bold">{item.value}</p>
                </Col>
              </Row>

              {index !== features.length - 1 && <Divider className="my-1!" />}
            </div>
          ))}
        </div>
      </Card>

      {listing.description && (
        <Card variant="borderless">
          <p className="text-primary mb-2">Mô tả chi tiết</p>
          <p className="whitespace-pre-line text-default">{listing.description}</p>
        </Card>
      )}

      {geo && (
        <Modal
          width={1300}
          title={
            <Flex gap={8}>
              <MapPin />
              <p className="text-[#222] text-sm">{listing.address?.fullAddress}</p>
            </Flex>
          }
          footer={false}
          open={isMapOpen}
          onCancel={() => setIsMapOpen(false)}
          destroyOnHidden
        >
          <div className="h-162.5">
            <LocationMap
              latitude={geo.latitude}
              longitude={geo.longitude}
              popupText={listing.title}
            />
          </div>
        </Modal>
      )}

      {/* Image Lightbox Overlay */}
      <ImageLightbox
        open={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        initialIndex={lightboxIndex}
        propertyTitle={listing.title}
        price={priceLabel}
        tags={[
          PROPERTY_CATEGORY_LABELS[listing.category],
          ...(listing.bedrooms != null ? [`${listing.bedrooms} PN`] : []),
        ]}
        description={listing.description}
        agent={agent || undefined}
        similarListings={lightboxSimilar}
        sampleQuestions={SAMPLE_QUESTIONS}
        isLiked={isFavorite}
        onLikeToggle={handleToggleFavorite}
        onShare={handleCopyLink}
      />
    </Flex>
  );
}
