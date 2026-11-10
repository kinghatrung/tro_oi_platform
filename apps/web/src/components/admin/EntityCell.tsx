import Image from 'next/image';
import type { ReactNode } from 'react';
import { Avatar, Flex } from 'antd';
import { UserRound } from 'lucide-react';

import { NO_IMAGE } from '@/constants';

interface EntityCellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Ảnh vuông bo góc (tin đăng, món đồ). */
  image?: string;
  /** Ảnh tròn (người dùng) — bỏ trống thì hiện icon người. */
  avatar?: string | null;
}

/** Ô "ảnh + tiêu đề + dòng phụ" dùng ở cột đầu bảng quản trị. */
export function EntityCell({ title, subtitle, image, avatar }: EntityCellProps) {
  // Bảng max-content: điện thoại phải chặn bề ngang thì line-clamp mới xuống dòng
  return (
    <Flex gap={12} align="center" className="min-w-64 max-w-64 sm:max-w-none">
      {avatar !== undefined ? (
        <Avatar src={avatar} icon={<UserRound size={18} />} />
      ) : (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-soft">
          <Image src={image || NO_IMAGE} alt="" fill sizes="56px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-xs text-subtle">{subtitle}</p>}
      </div>
    </Flex>
  );
}
