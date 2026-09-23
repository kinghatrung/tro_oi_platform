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
  Send,
  Flag,
  Headphones,
  Share2,
} from 'lucide-react';
import { ButtonDropdown, CardItem } from '@/components/common';

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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(isLikedProp);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionScrollRef = useRef<HTMLDivElement>(null);

  const questions = sampleQuestions ?? DEFAULT_QUESTIONS;

  // Synchronize index and favorite state when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsLiked(isLikedProp);
    }
  }, [open, initialIndex, isLikedProp]);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
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
    setMessages((prev) => [...prev, content]);
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
    <div className="fixed inset-0 z-50 flex flex-col gap-10 lg:flex-row bg-[#1c1c1e] text-white overflow-hidden animate-fadeIn p-6">
      {/* LEFT SECTION: MAIN IMAGE VIEWER */}
      <div className="flex-1 relative flex flex-col justify-between bg-[#1c1c1e] select-none min-h-[50vh] lg:min-h-full">
        {/* TOP TOOLBAR */}
        <div className="flex items-center justify-between z-20 w-full mb-2">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label="Toàn màn hình"
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
      <div className="px-6 pt-6 w-full lg:w-[470px] xl:w-[470px] text-[#222] bg-white overflow-y-auto rounded-none lg:rounded-xl shadow-2xl shrink-0 max-h-full">
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
          <div className="flex items-center gap-2 mb-2 justify-end">
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
        <div className="relative flex items-center bg-[#f7f8f8] rounded-full px-4 py-2 border border-gray-200 focus-within:border-[#16A6A3] transition-all">
          <Input
            variant="borderless"
            placeholder="Nhắn tin hỏi mua hàng..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onPressEnter={() => handleSendMessage()}
            className="text-xs text-[#073B3D] placeholder:text-gray-400 p-0"
          />
          <button
            onClick={() => handleSendMessage()}
            aria-label="Gửi tin nhắn"
            className="text-[#16A6A3] hover:text-[#0F8F8C] transition-colors cursor-pointer pl-2"
          >
            <Send size={18} />
          </button>
        </div>

        {/* QUICK QUESTION SUGGESTION CHIPS */}
        {questions.length > 0 && (
          <div className="relative flex items-center gap-1 mt-1">
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
            <Divider className="my-2!" />
            <div>
              <p className="text-primary mb-4 font-bold text-base">Tin đăng tương tự</p>
              <Flex vertical gap={8}>
                {/* {similarListings.map((item) => (
                  <CardItem key={item.id} column {...item} />
                ))} */}
                <div className="flex gap-3">
                  <div className="relative h-29.5 w-29.5 min-w-29.5 overflow-hidden rounded-lg">
                    <Image
                      src={'/images/test.jpg'}
                      alt={'Ảnh nhà đất'}
                      fill
                      sizes="118px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-col">
                    <p>Xuân Đỉnh 42m2 6 tầng mt5m ô tô vào nhà - xây mới, ngõ thông.</p>
                    <p></p>
                    <p>15 tỷ</p>
                    <p>Bắc từ liêm hà nội</p>
                  </div>
                </div>
              </Flex>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
