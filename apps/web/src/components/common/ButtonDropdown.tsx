import { Dropdown, Button, type ButtonProps, type MenuProps, type DropdownProps } from 'antd';
import { ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';

interface ButtonDropdownProps extends Omit<ButtonProps, 'icon' | 'children'> {
  menus?: MenuProps['items'];
  onMenuClick?: MenuProps['onClick'];
  selectedKeys?: string[];
  popupRender?: DropdownProps['popupRender'];
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: ReactNode;
  placement?: DropdownProps['placement'];
  /** Hiển thị icon mũi tên xuống mặc định (bỏ qua nếu đã truyền iconRight). Mặc định: false */
  dropdown?: boolean;
  /** Icon truyền cho prop `icon` gốc của antd Button (dùng cho icon-only button) */
  iconButton?: ReactNode;
}

export function ButtonDropdown({
  menus,
  onMenuClick,
  selectedKeys,
  popupRender,
  iconLeft,
  iconRight,
  label,
  dropdown = false,
  iconButton,
  className,
  placement = 'bottomLeft',
  ...buttonProps
}: ButtonDropdownProps) {
  const rightIcon = iconRight ?? (dropdown ? <ChevronDown size={16} /> : null);
  const hasContent = Boolean(iconLeft || label || rightIcon);

  return (
    <Dropdown
      menu={{ items: menus, onClick: onMenuClick, selectedKeys }}
      trigger={['click']}
      placement={placement}
      popupRender={popupRender}
    >
      <Button icon={iconButton} className={className} {...buttonProps}>
        {hasContent && (
          <span className="inline-flex items-center gap-1.5">
            {iconLeft}
            {label && <span className="text-[16px] text-black">{label}</span>}
            {rightIcon}
          </span>
        )}
      </Button>
    </Dropdown>
  );
}
