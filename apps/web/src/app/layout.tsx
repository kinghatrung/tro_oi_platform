import type { Metadata } from 'next';
import { Reddit_Sans } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';

import { Providers } from './providers';

const redditSans = Reddit_Sans({
  variable: '--font-reddit-sans',
  subsets: ['latin', 'vietnamese'],
});

export const metadata: Metadata = {
  title: 'Trọ ơi: Tìm trọ nhanh chóng, dễ dàng',
  description:
    'Trọ ơi là nền tảng tìm trọ trực tuyến giúp bạn dễ dàng tìm kiếm và thuê phòng trọ, căn hộ, nguyên căn, mặt bằng và tìm người ở ghép tại Việt Nam.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${redditSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
