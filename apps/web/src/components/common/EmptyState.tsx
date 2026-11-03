import type { ReactNode } from 'react';
import { Empty } from 'antd';

/** Ngữ cảnh trạng thái rỗng → chọn hình minh hoạ trong /images/empty. */
export enum EmptyVariant {
  SEARCH = 'search',
  LISTING = 'listing',
  FAVORITE = 'favorite',
  CHAT = 'chat',
}

interface EmptyStateProps {
  variant: EmptyVariant;
  description: ReactNode;
  /** small: dùng trong cột hẹp (danh sách chat, bảng). */
  size?: 'default' | 'small';
  /** Nút hành động bên dưới (vd "Đăng tin ngay"). */
  children?: ReactNode;
  className?: string;
}

// flex: globals.css đặt img { display: block } nên text-align: center của AntD không căn giữa được ảnh
const IMAGE_CLASS = {
  default: 'brand-art flex! justify-center h-30!',
  small: 'brand-art flex! justify-center h-20!',
};

/** Trạng thái rỗng theo bộ nhận diện Trọ ơi — dùng thay cho <Empty> mặc định của AntD. */
export function EmptyState({
  variant,
  description,
  size = 'default',
  children,
  className,
}: EmptyStateProps) {
  return (
    <Empty
      image={`/images/empty/${variant}.svg`}
      classNames={{ image: IMAGE_CLASS[size] }}
      description={<span className="text-sm text-body">{description}</span>}
      className={className}
    >
      {children}
    </Empty>
  );
}
