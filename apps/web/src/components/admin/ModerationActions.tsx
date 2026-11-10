'use client';

import { App, Input } from 'antd';
import { Check, Eye, EyeOff, Trash2, X } from 'lucide-react';
import type { ListingStatus, ProductStatus } from '@tro-oi/shared';

import { IconAction, RowActions } from './RowActions';

interface ModerationActionsProps {
  status: `${ListingStatus}` | `${ProductStatus}`;
  /** Trang công khai của tin (chỉ hiện khi đang hiển thị). */
  viewHref: string;
  /** true = hiển thị (duyệt / hiện lại), false = ẩn (từ chối / ẩn — kèm lý do admin nhập). */
  onSetVisible: (visible: boolean, successText: string, note?: string) => void;
  onDelete: () => void;
}

/** Cột thao tác kiểm duyệt dùng chung cho tin Trọ ơi và Chợ ơi. */
export function ModerationActions({
  status,
  viewHref,
  onSetVisible,
  onDelete,
}: ModerationActionsProps) {
  const { modal } = App.useApp();

  /** Hỏi lý do (không bắt buộc) rồi ẩn — lý do đi kèm thông báo gửi chủ tin. */
  const hideWithNote = (title: string, okText: string, successText: string) => {
    let note = '';
    modal.confirm({
      title,
      icon: null,
      okText,
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      content: (
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor="moderation-note" className="text-sm text-body">
            Lý do (gửi kèm thông báo cho người đăng)
          </label>
          <Input.TextArea
            id="moderation-note"
            autoFocus
            rows={3}
            maxLength={500}
            showCount
            placeholder="VD: Ảnh không đúng thực tế, thiếu giá rõ ràng..."
            onChange={(event) => {
              note = event.target.value;
            }}
          />
        </div>
      ),
      onOk: () => onSetVisible(false, successText, note.trim() || undefined),
    });
  };

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
            onClick={() => hideWithNote('Từ chối tin này?', 'Từ chối', 'Đã từ chối')}
          />
        </>
      )}
      {status === 'active' && (
        <>
          <IconAction title="Xem trên web" icon={<Eye size={14} />} href={viewHref} />
          <IconAction
            title="Ẩn"
            icon={<EyeOff size={14} />}
            onClick={() => hideWithNote('Ẩn tin khỏi trang công khai?', 'Ẩn tin', 'Đã ẩn')}
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
