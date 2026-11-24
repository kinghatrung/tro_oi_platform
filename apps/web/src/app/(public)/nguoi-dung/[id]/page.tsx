import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Row, Col } from 'antd';

import { ApiError } from '@/api/axiosClient';
import { searchListings } from '@/api/listings';
import { getReviews } from '@/api/reviews';
import { getUser } from '@/api/users';
import { ProfileHeader, ProfileListings, ProfileReviews } from '@/components/sections';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

const LISTINGS_PAGE_SIZE = 10;

const getUserOrNotFound = cache(async (id: string) => {
  try {
    return await getUser(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getUserOrNotFound((await params).id);
  return { title: `${user.name}` };
}

/** Hồ sơ công khai của người đăng tin + các tin đang hiển thị + đánh giá. */
export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const [user, listings, reviews] = await Promise.all([
    getUserOrNotFound(id),
    searchListings({ authorId: id, page, pageSize: LISTINGS_PAGE_SIZE }),
    getReviews(id),
  ]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ProfileHeader user={user} />
      </Col>

      <Col span={24}>
        <ProfileListings
          readOnly
          listings={listings.items}
          pagination={{ total: listings.total, page, pageSize: LISTINGS_PAGE_SIZE }}
        />
      </Col>

      <Col span={24}>
        <ProfileReviews userId={id} initial={reviews} />
      </Col>
    </Row>
  );
}
