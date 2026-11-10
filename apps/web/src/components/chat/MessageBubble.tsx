'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useState } from 'react';
import { Tooltip } from 'antd';
import { Check, CircleAlert, Clock3, ZoomIn } from 'lucide-react';
import { MessageStatus, type ChatMessage } from '@tro-oi/shared';

import { ImageLightbox } from '@/components/common';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  /** Tên người gửi (cột phải khi xem ảnh). */
  senderName: string;
  /** Trả lời 1 ảnh: gửi tin kèm chính ảnh đó để người kia biết đang nói về ảnh nào. */
  onReplyImage?: (content: string, imageUrl: string) => void;
}

const IMAGE_QUESTIONS = [
  'Ảnh này chụp gần đây không ạ?',
  'Cho mình xem thêm ảnh góc khác nhé',
  'Mình đến xem trực tiếp được không ạ?',
];

const STATUS_HINTS: Record<MessageStatus, string> = {
  [MessageStatus.SENDING]: 'Đang gửi',
  [MessageStatus.SENT]: 'Đã gửi',
  [MessageStatus.FAILED]: 'Gửi thất bại',
};

const STATUS_ICONS: Record<MessageStatus, React.ReactNode> = {
  [MessageStatus.SENDING]: <Clock3 size={12} />,
  [MessageStatus.SENT]: <Check size={12} />,
  [MessageStatus.FAILED]: <CircleAlert size={12} className="text-[#fecaca]" />,
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Bong bóng tin nhắn: của mình bên phải (màu chủ đạo), của người kia bên trái; ảnh bấm để phóng to. */
export function MessageBubble({ message, isMine, senderName, onReplyImage }: MessageBubbleProps) {
  const status = message.status ?? MessageStatus.SENT;
  const images = message.images ?? [];
  const [viewing, setViewing] = useState<number>();

  const meta = (
    <>
      {formatTime(message.createdAt)}
      {isMine && (
        <Tooltip title={STATUS_HINTS[status]}>
          <span aria-label={STATUS_HINTS[status]}>{STATUS_ICONS[status]}</span>
        </Tooltip>
      )}
    </>
  );

  return (
    <div className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx('flex max-w-[75%] flex-col gap-1', isMine ? 'items-end' : 'items-start')}
      >
        {images.length > 0 && (
          // Khối ảnh tách khỏi bong bóng màu; góc "đuôi" phía người gửi bo nhỏ như bong bóng chữ
          <div
            className={clsx(
              'relative grid w-64 max-w-full gap-0.5 overflow-hidden rounded-2xl bg-soft',
              isMine ? 'rounded-br-sm' : 'rounded-bl-sm',
              images.length > 1 && 'grid-cols-2',
              status === MessageStatus.SENDING && 'opacity-60',
            )}
          >
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                aria-label={`Xem ảnh ${index + 1}`}
                onClick={() => setViewing(index)}
                className={clsx(
                  'group relative cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
                  // 3 ảnh: ảnh đầu nằm ngang hết khối, 2 ảnh sau chia đôi
                  images.length === 3 && index === 0
                    ? 'col-span-2 aspect-[2/1]'
                    : images.length === 1
                      ? 'aspect-[4/5]'
                      : 'aspect-square',
                )}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  sizes="256px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                  <ZoomIn
                    size={22}
                    aria-hidden
                    className="text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100"
                  />
                </span>
              </button>
            ))}
            {/* Tin chỉ có ảnh: giờ gửi đè góc ảnh */}
            {!message.content && (
              <span className="pointer-events-none absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
                {meta}
              </span>
            )}
          </div>
        )}
        {message.content && (
          <div
            className={clsx(
              'rounded-2xl px-3 py-2',
              isMine ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-soft text-ink',
            )}
          >
            <p className="whitespace-pre-line break-words text-[15px] leading-5">
              {message.content}
            </p>
            <div
              className={clsx(
                'mt-1 flex items-center justify-end gap-1 text-[11px]',
                isMine ? 'text-white/80' : 'text-subtle',
              )}
            >
              {meta}
            </div>
          </div>
        )}
      </div>
      {viewing !== undefined && (
        <ImageLightbox
          open
          onClose={() => setViewing(undefined)}
          images={images}
          initialIndex={viewing}
          propertyTitle={`Ảnh từ ${senderName}`}
          tags={[
            new Date(message.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            }),
          ]}
          sampleQuestions={onReplyImage ? IMAGE_QUESTIONS : []}
          messagePlaceholder="Trả lời về ảnh này…"
          onSendMessage={
            onReplyImage &&
            ((content, index) => {
              onReplyImage(content, images[index]);
              setViewing(undefined); // đóng để thấy tin vừa gửi trong khung chat
            })
          }
        />
      )}
    </div>
  );
}
