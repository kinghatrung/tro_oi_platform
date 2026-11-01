'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Lỗi khi render/fetch phía server (thường do API không phản hồi). */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Result
        status="500"
        title="Có lỗi xảy ra"
        subTitle="Không tải được dữ liệu, vui lòng thử lại sau ít phút."
        extra={
          <Button type="primary" onClick={reset}>
            Thử lại
          </Button>
        }
      />
    </main>
  );
}
