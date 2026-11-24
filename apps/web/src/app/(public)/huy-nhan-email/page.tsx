import type { Metadata } from 'next';

import { NO_INDEX } from '@/lib/seo';

import { UnsubscribeEmail } from './UnsubscribeEmail';

export const metadata: Metadata = { title: 'Huỷ nhận email', ...NO_INDEX };

/** Link "huỷ nhận email" trong email thông báo: `?token=` do API ký cho từng tài khoản. */
export default async function UnsubscribeEmailPage({ searchParams }: PageProps<'/huy-nhan-email'>) {
  const { token } = await searchParams;
  return <UnsubscribeEmail token={typeof token === 'string' ? token : ''} />;
}
