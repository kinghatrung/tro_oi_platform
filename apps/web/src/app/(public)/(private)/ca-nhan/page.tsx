'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Col, Row, Skeleton } from 'antd';
import { LayoutDashboard } from 'lucide-react';
import type { Listing } from '@tro-oi/shared';

import { getMyListings } from '@/api/listings';
import { ProfileHeader, ProfileListings, ProfileReviews } from '@/components/sections';
import { useAuthStore, useRequireUser } from '@/stores/useAuthStore';

import { ProfileEditModal } from './ProfileEditModal';

/** Hồ sơ của tôi: sửa hồ sơ + xem tin đã đăng. Quản lý tin ở /kenh-nguoi-dang. */
export default function ProfilePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const user = useRequireUser();
  const setUser = useAuthStore((state) => state.setUser);
  const [listings, setListings] = useState<Listing[]>();
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyListings()
      .then(setListings)
      .catch((error: Error) => message.error(error.message));
  }, [message, user]);

  if (!user) {
    return (
      <Card variant="borderless">
        <Skeleton avatar active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ProfileHeader user={user} onEditProfile={() => setIsEditOpen(true)} />
      </Col>

      <Col span={24}>
        {listings ? (
          <ProfileListings
            listings={listings}
            onPostListing={() => router.push('/dang-tin')}
            extra={
              <Link href="/kenh-nguoi-dang/tin-dang">
                <Button icon={<LayoutDashboard size={16} />}>Quản lý tin</Button>
              </Link>
            }
          />
        ) : (
          <Card variant="borderless">
            <Skeleton active />
          </Card>
        )}
      </Col>

      <Col span={24}>
        <ProfileReviews />
      </Col>

      <ProfileEditModal
        user={user}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={setUser}
      />
    </Row>
  );
}
