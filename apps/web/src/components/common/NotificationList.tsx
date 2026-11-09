import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react';
import { NotificationKind, type AppNotification } from '@tro-oi/shared';

import { formatRelativeTime } from '@/utils/helpers';

const KIND_ICON: Record<NotificationKind, React.ReactNode> = {
  [NotificationKind.INFO]: <Info size={20} className="text-brand" />,
  [NotificationKind.SUCCESS]: <CircleCheck size={20} className="text-green-600" />,
  [NotificationKind.WARNING]: <CircleAlert size={20} className="text-amber-500" />,
  [NotificationKind.ERROR]: <CircleX size={20} className="text-red-500" />,
};

interface NotificationListProps {
  items: AppNotification[];
  onItemClick: (notification: AppNotification) => void;
}

/** Danh sách thông báo (icon theo loại, chấm xanh = chưa đọc). Dùng ở chuông Navbar và trang /thong-bao. */
export function NotificationList({ items, onItemClick }: NotificationListProps) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onItemClick(item)}
            className={`flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-soft cursor-pointer ${
              item.read ? '' : 'bg-brand-soft'
            }`}
          >
            <span className="mt-0.5 shrink-0">{KIND_ICON[item.kind]}</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-ink ${item.read ? 'font-medium' : 'font-bold'}`}>
                {item.title}
              </span>
              {item.message && <span className="block text-sm text-body">{item.message}</span>}
              <span className="mt-1 block text-xs text-subtle">
                {formatRelativeTime(item.createdAt)}
              </span>
            </span>
            {!item.read && (
              <span aria-label="Chưa đọc" className="mt-2 size-2 shrink-0 rounded-full bg-brand" />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
