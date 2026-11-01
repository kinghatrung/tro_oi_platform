import clsx from 'clsx';
import { Tooltip } from 'antd';
import { Check, Clock3, CircleAlert } from 'lucide-react';
import { MessageStatus, type ChatMessage } from '@tro-oi/shared';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

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

/** Bong bóng tin nhắn: của mình bên phải (màu chủ đạo), của người kia bên trái. */
export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const status = message.status ?? MessageStatus.SENT;

  return (
    <div className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[75%] rounded-2xl px-3 py-2',
          isMine
            ? 'rounded-br-sm bg-[#16a6a3] text-white'
            : 'rounded-bl-sm bg-[#f4f4f4] text-[#222]',
        )}
      >
        <p className="whitespace-pre-line break-words text-[15px] leading-5">{message.content}</p>
        <div
          className={clsx(
            'mt-1 flex items-center justify-end gap-1 text-[11px]',
            isMine ? 'text-white/80' : 'text-[#8c8c8c]',
          )}
        >
          {formatTime(message.createdAt)}
          {isMine && (
            <Tooltip title={STATUS_HINTS[status]}>
              <span aria-label={STATUS_HINTS[status]}>{STATUS_ICONS[status]}</span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
