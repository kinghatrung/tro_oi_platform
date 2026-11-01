import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Row, Col } from 'antd';

import { ApiError } from '@/api/axiosClient';
import { getListing, searchListings } from '@/api/listings';
import { SectionNews, AgentCard, PropertyOverview } from '@/components/sections';
import { formatListingPrice } from '@/utils/helpers';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Tin không tồn tại / đã ẩn → trang 404; lỗi khác để error boundary xử lý.
 * cache: metadata và page dùng chung 1 lần gọi API.
 */
const getListingOrNotFound = cache(async (id: string) => {
  try {
    return await getListing(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const listing = await getListingOrNotFound((await params).slug);
  return {
    title: `${listing.title} | Trọ ơi`,
    description: `${formatListingPrice(listing.price, listing.transaction)} - ${listing.address?.fullAddress ?? ''}`,
    openGraph: { images: listing.images.slice(0, 1) },
  };
}

/** Renders a property detail page for the requested listing id (slug). */
export default async function DetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListingOrNotFound(slug);
  const [similar, sameAuthor] = await Promise.all([
    searchListings({
      category: listing.category,
      transaction: listing.transaction,
      city: listing.address?.city,
      excludeId: listing.id,
      pageSize: 10,
    }),
    listing.author
      ? searchListings({ authorId: listing.author.id, excludeId: listing.id, pageSize: 10 })
      : undefined,
  ]);
  const similarHref = `/tim-kiem?${new URLSearchParams({
    category: listing.category,
    transaction: listing.transaction,
    ...(listing.address?.city && { city: listing.address.city }),
  })}`;

  return (
    <Row gutter={[16, 16]}>
      <Col lg={15} md={24} xs={24}>
        <PropertyOverview listing={listing} similarListings={similar.items} />
      </Col>

      <Col lg={9} md={24} xs={24}>
        {listing.author && <AgentCard author={listing.author} />}
      </Col>

      <Col span={24}>
        <SectionNews
          title="Tin đăng tương tự"
          items={similar.items}
          buttonText="Xem thêm"
          buttonHref={similarHref}
          classButton="w-75!"
          className="mb-0!"
        />
      </Col>

      {listing.author && sameAuthor && sameAuthor.items.length > 0 && (
        <Col span={24}>
          <SectionNews
            title={`Tin rao khác của ${listing.author.name}`}
            items={sameAuthor.items}
            buttonText="Xem trang cá nhân"
            buttonHref={`/nguoi-dung/${listing.author.id}`}
            classButton="w-75!"
          />
        </Col>
      )}
    </Row>
  );
}
