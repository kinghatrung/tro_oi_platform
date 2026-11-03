import { cache } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button, Card, Col, Row } from 'antd';

import { ApiError } from '@/api/axiosClient';
import { getProduct, searchProducts } from '@/api/products';
import { ProductCard } from '@/components/common';
import { AgentCard, ProductDetail } from '@/components/sections';
import { loadSiteSettings } from '@/lib/siteSettings';
import { formatVietnameseCurrency } from '@/utils/helpers';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Món không tồn tại / đã bán / Chợ ơi đang tắt → 404. cache: metadata + page dùng chung 1 lần gọi. */
const getProductOrNotFound = cache(async (id: string) => {
  if (!(await loadSiteSettings()).enableMarketplace) notFound();
  try {
    return await getProduct(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductOrNotFound((await params).id);
  return {
    title: product.title,
    description: `${formatVietnameseCurrency(product.price)} - ${product.address?.city ?? ''}`,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

/** Chi tiết món đồ Chợ ơi + người bán + đồ tương tự. */
export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductOrNotFound((await params).id);
  const similar = await searchProducts({
    category: product.category,
    excludeId: product.id,
    pageSize: 8,
  });

  return (
    <Row gutter={[16, 16]}>
      <Col lg={15} xs={24}>
        <ProductDetail product={product} />
      </Col>

      <Col lg={9} xs={24}>
        {product.seller && <AgentCard author={product.seller} />}
      </Col>

      {similar.items.length > 0 && (
        <Col span={24}>
          <Card
            variant="borderless"
            title="Đồ tương tự"
            extra={
              <Link href={`/cho-oi?category=${product.category}`}>
                <Button type="link">Xem thêm</Button>
              </Link>
            }
          >
            <Row gutter={[16, 16]}>
              {similar.items.map((item) => (
                <Col key={item.id} xs={12} md={6} lg={6}>
                  <ProductCard product={item} />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      )}
    </Row>
  );
}
