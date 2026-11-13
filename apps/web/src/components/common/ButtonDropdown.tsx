'use client';

import { Dropdown, Button, type ButtonProps, type MenuProps, type DropdownProps } from 'antd';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ButtonDropdownProps extends Omit<ButtonProps, 'icon' | 'children'> {
  menus?: MenuProps['items'];
  onMenuClick?: MenuProps['onClick'];
  selectedKeys?: string[];
  popupRender?: DropdownProps['popupRender'];
  getPopupContainer?: DropdownProps['getPopupContainer'];
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: ReactNode;
  placement?: DropdownProps['placement'];
  /** Hiển thị icon mũi tên xuống mặc định (bỏ qua nếu đã truyền iconRight). Mặc định: false */
  dropdown?: boolean;
  /** Icon truyền cho prop `icon` gốc của antd Button (dùng cho icon-only button) */
  iconButton?: ReactNode;
  /** Chọn mục không đóng dropdown — cho bộ lọc "chọn rồi Áp dụng" (footer CardDropdown còn bấm được). */
  keepOpenOnSelect?: boolean;
}

export function ButtonDropdown({
  menus,
  onMenuClick,
  selectedKeys,
  popupRender,
  getPopupContainer,
  iconLeft,
  iconRight,
  label,
  dropdown = false,
  iconButton,
  className,
  placement = 'bottomLeft',
  keepOpenOnSelect = false,
  ...buttonProps
}: ButtonDropdownProps) {
  const rightIcon = iconRight ?? (dropdown ? <ChevronDown size={16} /> : null);
  const hasContent = Boolean(iconLeft || label || rightIcon);
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      menu={{ items: menus, onClick: onMenuClick, selectedKeys }}
      open={open}
      onOpenChange={(next, info) => {
        if (!next && keepOpenOnSelect && info.source === 'menu') return;
        setOpen(next);
      }}
      trigger={['click']}
      placement={placement}
      popupRender={popupRender}
      getPopupContainer={getPopupContainer}
    >
      <Button icon={iconButton} className={className} {...buttonProps}>
        {hasContent && (
          <span className="inline-flex items-center gap-1.5">
            {iconLeft}
            {label && <span className="text-[16px]">{label}</span>}
            {rightIcon}
          </span>
        )}
      </Button>
    </Dropdown>
  );
}
