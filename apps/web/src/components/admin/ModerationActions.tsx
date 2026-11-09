'use client';

import { Check, Eye, EyeOff, Trash2, X } from 'lucide-react';
import type { ListingStatus, ProductStatus } from '@tro-oi/shared';

import { IconAction, RowActions } from './RowActions';

interface ModerationActionsProps {
  status: `${ListingStatus}` | `${ProductStatus}`;
  /** Trang công khai của tin (chỉ hiện khi đang hiển thị). */
  viewHref: string;
  /** true = hiển thị (duyệt / hiện lại), false = ẩn (từ chối / ẩn). */
  onSetVisible: (visible: boolean, successText: string) => void;
  onDelete: () => void;
}

/** Cột thao tác kiểm duyệt dùng chung cho tin Trọ ơi và Chợ ơi. */
export function ModerationActions({
  status,
  viewHref,
  onSetVisible,
  onDelete,
}: ModerationActionsProps) {
  return (
    <RowActions>
      {status === 'pending' && (
        <>
          <IconAction
            title="Duyệt"
            icon={<Check size={14} />}
            primary
            onClick={() => onSetVisible(true, 'Đã duyệt')}
          />
          <IconAction
            title="Từ chối (ẩn)"
            icon={<X size={14} />}
            onClick={() => onSetVisible(false, 'Đã từ chối')}
          />
        </>
      )}
      {status === 'active' && (
        <>
          <IconAction title="Xem trên web" icon={<Eye size={14} />} href={viewHref} />
          <IconAction
            title="Ẩn"
            icon={<EyeOff size={14} />}
            onClick={() => onSetVisible(false, 'Đã ẩn')}
          />
        </>
      )}
      {(status === 'closed' || status === 'expired') && (
        <IconAction
          title="Hiển thị lại"
          icon={<Eye size={14} />}
          onClick={() => onSetVisible(true, 'Đã hiển thị lại')}
        />
      )}
      <IconAction
        title="Xoá"
        icon={<Trash2 size={14} />}
        danger
        confirm={{ title: 'Xoá vĩnh viễn tin này?', okText: 'Xoá' }}
        onClick={onDelete}
      />
    </RowActions>
  );
}
