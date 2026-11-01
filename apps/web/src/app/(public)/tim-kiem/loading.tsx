import { Card, Skeleton } from 'antd';

/**
 * Skeleton khi đổi bộ lọc/trang. Chỉ đặt ở route không gọi notFound():
 * loading.tsx làm response stream sớm với HTTP 200, trang 404 sẽ mất status 404.
 */
export default function Loading() {
  return (
    <Card variant="borderless">
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  );
}
