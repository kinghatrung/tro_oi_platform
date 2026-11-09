'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { Button, Flex, Popconfirm, Tooltip } from 'antd';

interface IconActionProps {
  /** Tooltip + aria-label. */
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  /** Mở link ở tab mới thay cho onClick. */
  href?: string;
  primary?: boolean;
  danger?: boolean;
  /** Có thì hỏi xác nhận trước khi chạy onClick. */
  confirm?: { title: string; description?: string; okText: string };
}

// Cột thao tác nằm trong dòng có onRow click → chặn nổi bọt để không mở drawer
const stop = (event: MouseEvent) => event.stopPropagation();

/** Nút icon nhỏ trong cột thao tác của bảng quản trị. */
export function IconAction({
  title,
  icon,
  onClick,
  href,
  primary,
  danger,
  confirm,
}: IconActionProps) {
  const button = (
    <Button
      size="small"
      variant="text"
      color={danger ? 'danger' : primary ? 'primary' : 'default'}
      aria-label={title}
      icon={icon}
      onClick={confirm || href ? undefined : onClick}
    />
  );
  const withTooltip = <Tooltip title={title}>{button}</Tooltip>;

  if (href) {
    return (
      <Link href={href} target="_blank" onClick={stop}>
        {withTooltip}
      </Link>
    );
  }
  if (confirm) {
    return (
      <span onClick={stop}>
        <Popconfirm
          title={confirm.title}
          description={confirm.description}
          okText={confirm.okText}
          cancelText="Huỷ"
          okButtonProps={{ danger }}
          onConfirm={onClick}
        >
          {withTooltip}
        </Popconfirm>
      </span>
    );
  }
  return <span onClick={stop}>{withTooltip}</span>;
}

/** Nhóm nút thao tác cuối dòng. */
export function RowActions({ children }: { children: ReactNode }) {
  return <Flex gap={4}>{children}</Flex>;
}
