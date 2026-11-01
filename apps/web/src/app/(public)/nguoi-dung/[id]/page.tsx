import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Row, Col } from 'antd';

import { ApiError } from '@/api/axiosClient';
import { searchListings } from '@/api/listings';
import { getUser } from '@/api/users';
import { ProfileHeader, ProfileListings, ProfileReviews } from '@/components/sections';

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  return { title: `${user.name} | Trọ ơi` };
}

/** Hồ sơ công khai của người đăng tin + các tin đang hiển thị. */
export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [user, listings] = await Promise.all([
    getUserOrNotFound(id),
    // shortcut: chỉ lấy 50 tin mới nhất, thêm phân trang khi có người đăng nhiều hơn
    searchListings({ authorId: id, pageSize: 50 }),
  ]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ProfileHeader user={user} />
      </Col>

      <Col span={24}>
        <ProfileListings readOnly listings={listings.items} />
      </Col>

      <Col span={24}>
        <ProfileReviews />
      </Col>
    </Row>
  );
}
