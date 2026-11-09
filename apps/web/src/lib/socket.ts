import { io, type Socket } from 'socket.io-client';

import axiosClient, { getAccessToken } from '@/api/axiosClient';

let socket: Socket | null = null;

/**
 * 1 kết nối Socket.IO /chat dùng chung cho cả web (badge Navbar + trang tin nhắn).
 * Không tự kết nối; token đọc lại mỗi lần (re)connect. Token sai → connect_error "unauthorized".
 */
export function getChatSocket() {
  socket ??= io(`${axiosClient.defaults.baseURL}/chat`, {
    auth: (callback) => callback({ token: getAccessToken() }),
    autoConnect: false,
    // Chỉ WebSocket (không long-polling): chạy nhiều instance API sau load balancer không cần sticky session
    transports: ['websocket'],
  });
  return socket;
}
