'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Badge, Button } from 'antd';
import { MessageCircle } from 'lucide-react';

import { getChatSocket } from '@/lib/socket';
import { useChatStore } from '@/stores/useChatStore';

/**
 * Nút "Tin nhắn" trên Navbar + vòng đời kết nối chat: đã đăng nhập thì mở socket /chat,
 * cập nhật trạng thái kết nối và số tin chưa đọc (useChatStore) cho cả trang /tin-nhan.
 */
export function MessagesButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const unread = useChatStore((state) => state.unread);

  useEffect(() => {
    if (!isLoggedIn) return;
    const socket = getChatSocket();
    const { refreshUnread, setConnected } = useChatStore.getState();
    // Lỗi mạng tạm thời: bỏ qua, sự kiện kế tiếp sẽ tải lại
    const refresh = () => void refreshUnread().catch(() => undefined);
    const onConnect = () => {
      setConnected(true);
      refresh(); // kết nối lại: có thể đã lỡ tin trong lúc mất mạng
    };
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    socket.on('message:new', refresh);
    socket.on('conversation:read', refresh);
    setConnected(socket.connected);
    socket.connect();
    refresh();
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('message:new', refresh);
      socket.off('conversation:read', refresh);
    };
  }, [isLoggedIn]);

  return (
    <Link href="/tin-nhan">
      <Badge count={isLoggedIn ? unread : 0} size="small" offset={[-4, 4]}>
        {/* 2 bản (icon / chữ) bật tắt bằng CSS: nút chỉ-icon của antd mới gọn 40px */}
        <Button aria-label="Tin nhắn" icon={<MessageCircle size={16} />} className="lg:hidden!" />
        <Button icon={<MessageCircle size={16} />} className="hidden! lg:inline-flex!">
          Tin nhắn
        </Button>
      </Badge>
    </Link>
  );
}
