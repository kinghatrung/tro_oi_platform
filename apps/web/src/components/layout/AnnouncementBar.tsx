'use client';

import { Alert } from 'antd';
import type { AnnouncementType } from '@tro-oi/shared';

interface AnnouncementBarProps {
  text: string;
  type: AnnouncementType;
}

/** Thanh thông báo toàn site — admin bật/tắt và soạn nội dung ở trang thiết lập. */
export function AnnouncementBar({ text, type }: AnnouncementBarProps) {
  return <Alert banner closable showIcon type={type} message={text} className="text-center!" />;
}
