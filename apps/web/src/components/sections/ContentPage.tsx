import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card } from 'antd';
import type { ContentBlock, PageSlug } from '@tro-oi/shared';

import { ApiError } from '@/api/axiosClient';
import { getPage } from '@/api/pages';

// Server Component async — KHÔNG export qua components/sections/index.ts (barrel có client component)

/** Trang chưa đăng / không tồn tại → 404. cache: metadata và page dùng chung 1 lần gọi. */
const loadPage = cache(async (slug: PageSlug) => {
  try {
    return await getPage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function contentPageMetadata(slug: PageSlug): Promise<Metadata> {
  const page = await loadPage(slug);
  return { title: page.title };
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-8 mb-3 text-lg font-bold text-ink">{block.text}</h2>;
    case 'h3':
      return <h3 className="mt-5 mb-2 font-semibold text-ink">{block.text}</h3>;
    case 'ul':
      return (
        <ul className="mb-4 list-disc space-y-1 pl-6">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    default:
      return <p className="mb-4">{block.text}</p>;
  }
}

/** Trang nội dung admin soạn (Điều khoản, Chính sách bảo mật) — render chữ thuần, không HTML. */
export async function ContentPage({ slug }: { slug: PageSlug }) {
  const page = await loadPage(slug);
  return (
    <Card variant="borderless">
      <article className="mx-auto max-w-200 leading-7 text-default">
        <h1 className="text-primary text-2xl!">{page.title}</h1>
        <p className="mt-1 mb-6 text-sm text-subtle">
          Cập nhật ngày{' '}
          {new Date(page.updatedAt).toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
          })}
        </p>
        {page.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </article>
    </Card>
  );
}
