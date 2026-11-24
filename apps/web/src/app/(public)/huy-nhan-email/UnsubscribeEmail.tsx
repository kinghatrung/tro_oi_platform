'use client';

import Link from 'next/link';
import { useState } from 'react';
import { App, Button, Card } from 'antd';
import { MailCheck, MailX } from 'lucide-react';

import { unsubscribeEmail } from '@/api/notifications';

/**
 * Bấm nút mới huỷ (không tự huỷ khi mở trang): bộ quét link của hộp thư hay tự mở link trong email.
 */
export function UnsubscribeEmail({ token }: { token: string }) {
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeEmail(token);
      setIsDone(true);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card variant="borderless" className="w-full max-w-md text-center">
        {isDone ? (
          <MailCheck size={40} className="mx-auto mb-3 text-brand" />
        ) : (
          <MailX size={40} className="mx-auto mb-3 text-subtle" />
        )}
        <h1 className="mb-2 text-xl font-bold text-ink">
          {isDone ? 'Đã huỷ nhận email' : 'Huỷ nhận email thông báo?'}
        </h1>
        <p className="mb-6 text-body">
          {isDone
            ? 'Bạn sẽ không nhận email thông báo nữa. Thông báo vẫn hiện trên web; muốn nhận lại email, bật ở trang Thông báo.'
            : 'Bạn sẽ không nhận email về tin đăng, tin mới khớp tìm kiếm đã lưu... Thông báo vẫn hiện trên web.'}
        </p>
        {isDone ? (
          <Link href="/thong-bao">
            <Button>Đến trang Thông báo</Button>
          </Link>
        ) : token ? (
          <Button type="primary" danger loading={isLoading} onClick={handleUnsubscribe}>
            Huỷ nhận email
          </Button>
        ) : (
          <p className="text-subtle">Link không hợp lệ — hãy mở lại link trong email.</p>
        )}
      </Card>
    </div>
  );
}
