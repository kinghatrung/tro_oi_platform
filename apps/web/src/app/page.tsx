import type { Metadata } from 'next';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import { SITE_URL } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/siteSettings';

// Dữ liệu tin đăng thay đổi liên tục, không prerender lúc build
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { alternates: { canonical: '/' } };

/** Renders the public home page. */
export default async function Home() {
  const { siteName } = await loadSiteSettings();
  // Google lấy tên site từ dữ liệu cấu trúc WebSite trên trang chủ
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: SITE_URL,
  };
  return (
    <main>
      <script
        type="application/ld+json"
        // JSON.stringify không escape "<" → thay để tên site không đóng được thẻ script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c') }}
      />
      <Header />
      <Container />
      <Footer />
    </main>
  );
}
