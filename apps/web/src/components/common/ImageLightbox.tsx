'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, Button, Flex, Space, Tag, Input, type MenuProps } from 'antd';
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
import { ButtonDropdown } from '@/components/common';

export interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  propertyTitle?: string;
  price?: string;
  tags?: string[];
  description?: string;
  agent?: {
    name: string;
    avatar?: string;
    statusText?: string;
    phone?: string;
  };
}

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

const sampleQuestions = [
  'Tình trạng giấy tờ như thế nào ạ',
  'Có hỗ trợ trả góp không',
  'Thời hạn thuê tối thiểu bao lâu',
  'Có thể hẹn giờ đến xem nhà không ạ',
];

/** Renders an image lightbox modal with controls, gallery thumbnails, and listing sidebar. */
export function ImageLightbox({
  open,
  onClose,
  images,
  initialIndex = 0,
  propertyTitle = 'Studio Full Nội Thất 25m² – Gần Bệnh Viện E – Vào Ở Ngay',
  price = '3,2 triệu/tháng',
  tags = ['3 PN', 'Nhà ngõ, hẻm'],
  description = '+ Nhà mình đang cần tiền nên bán nhanh căn nhà 5 tầng tại phố Tân Mai, Đền Lừ...',
  agent = {
    name: 'Hoàng Nguyễn Thái ...',
    statusText: 'Hoạt động 4 ngày trước',
    phone: '098200****',
  },
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const questionScrollRef = useRef<HTMLDivElement>(null);

  // Synchronize index when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

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
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
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

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || messageInput.trim();
    if (!content) return;
    setMessages((prev) => [...prev, content]);
    if (!textToSend) setMessageInput('');
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
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#1c1c1e] text-white overflow-hidden animate-fadeIn">
      {/* LEFT SECTION: MAIN IMAGE VIEWER */}
      <div className="flex-1 relative flex flex-col justify-between bg-[#1c1c1e] p-4 select-none min-h-[50vh] lg:min-h-full">
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
      <div className="w-full lg:w-[390px] xl:w-[410px] bg-white text-[#073B3D] flex flex-col justify-between overflow-y-auto rounded-none lg:rounded-2xl shadow-2xl m-0 lg:m-4 shrink-0 max-h-full">
        <div className="p-5 flex flex-col gap-4">
          {/* SELLER / AGENT HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar
                size={44}
                className="bg-[#FAAD14]! text-white! font-bold text-lg flex items-center justify-center shrink-0"
              >
                {agent.name.charAt(0).toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#073B3D] truncate max-w-[180px]">
                  {agent.name}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  {agent.statusText}
                </span>
              </div>
            </div>
            <Button className="h-8!">Xem trang</Button>
          </div>

          {/* LISTING TITLE & HEART */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-base font-bold text-[#073B3D] leading-snug line-clamp-2">
              {propertyTitle}
            </h1>
            <button
              onClick={() => setIsLiked(!isLiked)}
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
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Tag
                key={i}
                className="bg-gray-100! text-[#315B5D]! border-none! text-xs font-medium px-3 py-1 rounded-md"
              >
                {tag}
              </Tag>
            ))}
          </div>

          {/* PRICE */}
          <div className="text-2xl font-bold text-[#16A6A3] tracking-tight">{price}</div>

          {/* DESCRIPTION */}
          <div className="text-sm text-[#315B5D] leading-relaxed">
            <p className={showFullDesc ? '' : 'line-clamp-2'}>{description}</p>
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[#16A6A3] text-xs font-semibold mt-1 hover:underline cursor-pointer"
            >
              {showFullDesc ? 'Thu gọn' : 'Xem thêm'}
            </button>
          </div>

          {/* MESSAGES LOG IF ANY */}
          {messages.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 font-medium">Tin nhắn của bạn:</span>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="self-end bg-[#16A6A3] text-white text-xs py-1.5 px-3 rounded-2xl rounded-tr-none max-w-[85%]"
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION & CHAT SECTION */}
        <div className="p-5 pt-2 flex flex-col gap-3 border-t border-gray-100 bg-white">
          {/* CONTACT BUTTONS */}
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 bg-gray-100! hover:bg-gray-200! border-none! text-[#073B3D]! font-semibold text-xs h-10 rounded-xl"
              onClick={() => setShowPhone(!showPhone)}
            >
              {showPhone ? agent.phone : `Hiện số ${agent.phone}`}
            </Button>
            <Button className="flex-1 border-gray-200! hover:border-[#16A6A3]! text-[#073B3D]! font-semibold text-xs h-10 rounded-xl">
              Zalo
            </Button>
            <Button
              type="primary"
              className="flex-1 bg-[#16A6A3]! hover:bg-[#0F8F8C]! font-semibold text-xs h-10 rounded-xl shadow-md"
            >
              Chat
            </Button>
          </div>

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
          <div className="relative flex items-center gap-1 mt-1">
            <div
              ref={questionScrollRef}
              className="flex gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 text-xs bg-gray-100 hover:bg-[#EAF8F7] hover:text-[#16A6A3] text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollQuestions('right')}
              aria-label="Xem thêm câu hỏi"
              className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 hover:text-[#16A6A3] cursor-pointer z-10"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
