'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Button, Tag, Input, Divider, type MenuProps, Flex } from 'antd';
import {
  X,
  Maximize2,
  Minimize2,
  EllipsisVertical,
  ChevronLeft,
  ChevronRight,
  Heart,
  Flag,
  Headphones,
  Share2,
  MapPin,
  SendHorizontal,
} from 'lucide-react';
import { ButtonDropdown } from '@/components/common';

export interface AgentInfo {
  name: string;
  avatar?: string;
  statusText?: string;
  phone?: string;
  profileUrl?: string;
}

export interface SimilarListingItem {
  id: number;
  imageUrl?: string;
  title?: string;
  timeAgo?: string;
  countMedia?: number;
  propertyType?: string;
  area?: number;
  price?: number;
  pricePerSquareMeter?: number;
  bedrooms?: number;
  mainDirection?: string;
  address?: string;
  location?: string;
  district?: string;
  street?: string;
  floorCount?: number;
  furnishing?: string;
  author?: {
    name?: string;
    posted?: number;
    rank?: string;
  };
}

export interface ImageLightboxProps {
  /** Controls lightbox visibility */
  open: boolean;
  /** Triggered when closing the lightbox */
  onClose: () => void;
  /** List of image URLs to display */
  images: string[];
  /** Index of the image to start with */
  initialIndex?: number;
  /** Property title */
  propertyTitle?: string;
  /** Formatted price string (e.g. "3,2 triệu/tháng") */
  price?: string;
  /** Feature tags / badges */
  tags?: string[];
  /** Detailed property description */
  description?: string;
  /** Agent / poster details */
  agent?: AgentInfo;
  /** Quick question chips */
  sampleQuestions?: string[];
  /** Similar property listings for sidebar */
  similarListings?: SimilarListingItem[];
  /** Initial favorite state */
  isLiked?: boolean;
  /** Triggered when user clicks the favorite button */
  onLikeToggle?: (isLiked: boolean) => void;
  /** Triggered when user sends a message or selects a question chip */
  onSendMessage?: (message: string) => void;
  /** Triggered on share action */
  onShare?: () => void;
  /** Triggered on report action */
  onReport?: () => void;
  /** Triggered on help action */
  onHelp?: () => void;
  /** Triggered when clicking agent profile button */
  onViewAgentProfile?: () => void;
}

const DEFAULT_QUESTIONS = [
  'Tình trạng giấy tờ như thế nào ạ',
  'Có hỗ trợ trả góp không',
  'Thời hạn thuê tối thiểu bao lâu',
  'Có thể hẹn giờ đến xem nhà không ạ',
];

const menuItems: MenuProps['items'] = [
  {
    key: 'share',
    label: <span className="ml-2 text-sm font-medium">Chia sẻ</span>,
    icon: <Share2 size={18} />,
  },
  {
    key: 'report',
    label: <span className="ml-2 text-sm font-medium">Báo cáo tin đăng</span>,
    icon: <Flag size={18} />,
  },
  {
    key: 'help',
    label: <span className="ml-2 text-sm font-medium">Cần trợ giúp</span>,
    icon: <Headphones size={18} />,
  },
];

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(Number.isFinite(index) ? Math.trunc(index) : 0, length - 1));
}

/** Renders an image lightbox modal with controls, gallery thumbnails, and listing sidebar. */
export function ImageLightbox({
  open,
  onClose,
  images = [],
  initialIndex = 0,
  propertyTitle,
  price,
  tags,
  description,
  agent,
  sampleQuestions,
  similarListings,
  isLiked: isLikedProp = false,
  onLikeToggle,
  onSendMessage,
  onShare,
  onReport,
  onHelp,
  onViewAgentProfile,
}: ImageLightboxProps) {
  const [imageIndex, setCurrentIndex] = useState(() => clampIndex(initialIndex, images.length));
  const currentIndex = clampIndex(imageIndex, images.length);
  const visible = open && images.length > 0;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(isLikedProp);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionScrollRef = useRef<HTMLDivElement>(null);

  const questions = sampleQuestions ?? DEFAULT_QUESTIONS;

  // Synchronize index and favorite state when opened
  useEffect(() => {
    if (open) {
      // Reset the retained gallery state when its opening props change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(clampIndex(initialIndex, images.length));
      setIsLiked(isLikedProp);
    }
  }, [open, initialIndex, isLikedProp, images.length]);

  // Auto scroll active thumbnail into view
  useEffect(() => {
    if (open && thumbRefs.current[currentIndex]) {
      thumbRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex, open]);

  useEffect(() => {
    if (!visible) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) {
        closeButtonRef.current?.focus();
      }
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]',
        ) ?? [],
      ).filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(':disabled') &&
          element.getClientRects().length > 0,
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('focusin', containFocus);
    document.addEventListener('keydown', trapTab);
    return () => {
      document.removeEventListener('focusin', containFocus);
      document.removeEventListener('keydown', trapTab);
      document.body.style.overflow = originalOverflow;
      trigger?.focus();
    };
  }, [visible]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    syncFullscreen();
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, [visible]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, handlePrev, handleNext]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
        // The request can finish after the dialog has closed.
        if (!dialogRef.current && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Unable to change fullscreen mode:', error);
    }
  };

  const handleLikeClick = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    onLikeToggle?.(nextState);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || messageInput.trim();
    if (!content) return;
    onSendMessage?.(content);
    if (!textToSend) setMessageInput('');
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'share') onShare?.();
    if (key === 'report') onReport?.();
    if (key === 'help') onHelp?.();
  };

  const scrollQuestions = (dir: 'left' | 'right') => {
    if (questionScrollRef.current) {
      questionScrollRef.current.scrollBy({
        left: dir === 'left' ? -200 : 200,
        behavior: 'smooth',
      });
    }
  };

  if (!open || images.length === 0) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={propertyTitle || 'Ảnh nhà đất'}
      className="fixed inset-0 z-50 flex flex-col gap-10 lg:flex-row bg-[#1c1c1e] text-white overflow-hidden animate-fadeIn p-6"
    >
      {/* LEFT SECTION: MAIN IMAGE VIEWER */}
      <div className="flex-1 relative flex flex-col justify-between bg-[#1c1c1e] select-none min-h-[50vh] lg:min-h-full">
        {/* TOP TOOLBAR */}
        <div className="flex items-center justify-between z-20 w-full mb-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Đóng"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
              aria-pressed={isFullscreen}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          {/* Center Counter */}
          <div className="px-4 py-1.5 rounded-full bg-black/50 text-white text-sm font-semibold tracking-wide backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <ButtonDropdown
              aria-label="Thao tác khác"
              placement="bottomRight"
              menus={menuItems}
              getPopupContainer={(trigger) => dialogRef.current ?? trigger}
              onMenuClick={handleMenuClick}
              className="w-10! h-10! rounded-full! bg-white/10! hover:bg-white/20! border-none! text-white! flex items-center justify-center cursor-pointer"
              iconButton={<EllipsisVertical size={20} className="text-white" />}
            />
          </div>
        </div>

        {/* CENTER IMAGE CONTAINER */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
          {/* Prev Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Ảnh trước"
            className="absolute left-3 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 active:bg-black flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10 cursor-pointer shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Main Image */}
          <div className="relative w-full h-full max-h-[72vh] flex items-center justify-center">
            <Image
              src={images[currentIndex]}
              alt={`Ảnh ${currentIndex + 1}`}
              fill
              priority
              className="object-contain transition-all duration-300 select-none"
              sizes="(max-width: 1024px) 100vw, 70vw"
            />
          </div>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Ảnh sau"
            className="absolute right-3 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 active:bg-black flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10 cursor-pointer shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* BOTTOM THUMBNAILS STRIP */}
        <div className="z-20 w-full pt-2">
          <div
            ref={thumbnailContainerRef}
            className="flex gap-2.5 overflow-x-auto justify-center items-center py-2 px-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((src, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  thumbRefs.current[idx] = el;
                }}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  currentIndex === idx
                    ? 'border-[#16A6A3] scale-105 shadow-md opacity-100 ring-2 ring-[#16A6A3]/30'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: SIDEBAR INFO PANEL */}
      <div className="w-full lg:w-[470px] xl:w-[470px] bg-white rounded-none lg:rounded-xl shadow-2xl shrink-0 max-h-full overflow-hidden">
        <div className="relative h-full overflow-y-auto px-6 pt-6">
          {/* SELLER / AGENT HEADER */}
          {agent && (
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                {agent.avatar ? (
                  <Avatar size={48} src={agent.avatar} className="shrink-0" />
                ) : (
                  <Avatar
                    size={48}
                    className="bg-[#FAAD14]! text-white! font-bold text-lg flex items-center justify-center shrink-0"
                  >
                    {agent.name ? agent.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-primary text-[16px] font-semibold">{agent.name}</span>
                  {agent.statusText && (
                    <span className="text-sm text-[#595959] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      {agent.statusText}
                    </span>
                  )}
                </div>
              </div>
              {(agent.profileUrl || onViewAgentProfile) && (
                <Button
                  className="h-8! btn-gray font-bold! text-[#222]"
                  onClick={() => {
                    if (onViewAgentProfile) {
                      onViewAgentProfile();
                    } else if (agent.profileUrl) {
                      window.location.href = agent.profileUrl;
                    }
                  }}
                >
                  Xem trang
                </Button>
              )}
            </div>
          )}

          {/* LISTING TITLE & HEART */}
          {(propertyTitle || isLiked !== undefined) && (
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                {propertyTitle && (
                  <Link
                    href="/chi-tiet"
                    className="text-[#222]! text-xl! font-bold! leading-snug line-clamp-2! hover:underline! cursor-pointer"
                  >
                    {propertyTitle}
                  </Link>
                )}
                <button
                  onClick={handleLikeClick}
                  aria-label="Yêu thích"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors shrink-0 cursor-pointer"
                >
                  <Heart
                    size={22}
                    className={isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                  />
                </button>
              </div>

              {/* TAGS / BADGES */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 mt-1">
                  {tags.map((tag, i) => (
                    <Tag
                      key={i}
                      className="bg-gray-100! text-[#222]! border-none! text-xs font-medium px-3 py-1 rounded-none!"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRICE */}
          {price && (
            <div className="text-2xl font-bold text-[#f0325e] tracking-tight mb-2">{price}</div>
          )}

          {/* DESCRIPTION */}
          {description && (
            <div className="text-default leading-relaxed whitespace-pre-line mb-2">
              <p className={showFullDesc ? '' : 'line-clamp-2'}>{description}</p>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-xs font-bold! mt-1 hover:underline cursor-pointer"
              >
                {showFullDesc ? 'Thu gọn' : 'Xem thêm'}
              </button>
            </div>
          )}

          {/* CONTACT BUTTONS */}
          {agent && (
            <div className="sticky bottom-0 z-30 -mx-6 px-6 py-3 bg-white/95 backdrop-blur-sm flex items-center gap-2 mb-2 justify-end">
              {agent.phone && (
                <Button
                  className="bg-gray-100! hover:bg-gray-200! border-none! text-[#073B3D]! font-semibold text-xs h-10 rounded-xl"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  {showPhone ? agent.phone : `Hiện số ${agent.phone}`}
                </Button>
              )}
              <Button
                type="primary"
                className="bg-[#16A6A3]! hover:bg-[#0F8F8C]! font-semibold text-xs h-10 rounded-xl shadow-md"
                onClick={() => handleSendMessage('Xin chào, tôi muốn hỏi thông tin về phòng này.')}
              >
                Chat
              </Button>
            </div>
          )}

          {/* QUICK MESSAGE INPUT */}
          <div className="relative flex items-center text-[#222] bg-[#f7f8f8] rounded-full px-4 py-1 border border-gray-200 focus-within:border-[#16A6A3] transition-all">
            <Input
              variant="borderless"
              placeholder="Nhắn tin hỏi mua hàng..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onPressEnter={() => handleSendMessage()}
              className="text-sm! text-[#222]! p-0 outline-none!"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              aria-label="Gửi tin nhắn"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#16A6A3] transition-all hover:bg-[#16A6A3]/10 hover:text-[#0F8F8C] active:scale-95"
            >
              <SendHorizontal size={18} strokeWidth={2} />
            </button>
          </div>

          {/* QUICK QUESTION SUGGESTION CHIPS */}
          {questions.length > 0 && (
            <div className="relative flex items-center gap-1 mt-2 text-[#222]">
              <button
                onClick={() => scrollQuestions('left')}
                aria-label="Xem thêm câu hỏi"
                className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 hover:text-[#16A6A3] cursor-pointer z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <div
                ref={questionScrollRef}
                className="flex align-center gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {questions.map((q, idx) => (
                  <span
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="shrink-0 text-sm font-medium bg-gray-100 hover:bg-[#e8e8e8] text-[#222] px-3 py-1.5 rounded-full border-none transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {q}
                  </span>
                ))}
              </div>
              <button
                onClick={() => scrollQuestions('right')}
                aria-label="Xem thêm câu hỏi"
                className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 hover:text-[#16A6A3] cursor-pointer z-10"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          {/* SIMILAR LISTINGS */}
          {similarListings && similarListings.length > 0 && (
            <>
              <Divider className="mt-3!" />
              <div>
                <p className="text-primary mb-4 font-bold text-base">Tin đăng tương tự</p>
                <Flex vertical gap={18} className="pb-8!">
                  {similarListings.map((item) => (
                    <div key={item.id} className="flex gap-3 cursor-pointer">
                      <div className="relative h-29.5 w-29.5 min-w-29.5 overflow-hidden rounded-lg">
                        <Image
                          src={item.imageUrl || '/images/test.jpg'}
                          alt={item.title || 'Ảnh nhà đất'}
                          fill
                          sizes="118px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-col justify-between">
                        <p className="text-default line-clamp-2 leading-snug">{item.title}</p>
                        <p className="text-sm text-[#8c8c8c]">
                          {item.bedrooms ? `${item.bedrooms} PN ` : ''}
                          {item.propertyType || 'Nhà ngõ, hẻm'}
                        </p>
                        <p className="text-primary text-[#f0325e]">
                          {typeof item.price === 'number'
                            ? `${(item.price / 1000000).toLocaleString('vi-VN')} triệu/tháng`
                            : item.price || '15 tỷ'}
                        </p>
                        <div className="flex items-start gap-1 text-xs text-[#8c8c8c]">
                          <MapPin size={14} className="shrink-0 text-gray-400 mt-0.5" />
                          <span className="text-sm text-[#8c8c8c]">
                            {item.address || 'Q. Bắc Từ Liêm'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </Flex>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
