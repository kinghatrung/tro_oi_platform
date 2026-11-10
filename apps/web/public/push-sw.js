/*
 * Service worker thông báo đẩy của Trọ ơi.
 * API gửi qua Firebase Cloud Messaging dạng data { title, body, link, tag } (PushService) —
 * chỉ gửi khi người dùng không mở web, nên luôn hiện thông báo.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const data = payload.data || payload.notification || {};
  const tag = data.tag || undefined;
  event.waitUntil(
    self.registration.showNotification(data.title || 'Trọ ơi', {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag,
      // Cùng tag (vd cùng cuộc trò chuyện) → thay thông báo cũ nhưng vẫn rung/chuông lại
      renotify: Boolean(tag),
      data: { link: data.link || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.link || '/', self.location.origin);
  // Chỉ mở trang trong site (không theo link ngoài)
  const url = target.origin === self.location.origin ? target.href : self.location.origin;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url === url);
      return open ? open.focus() : self.clients.openWindow(url);
    }),
  );
});
