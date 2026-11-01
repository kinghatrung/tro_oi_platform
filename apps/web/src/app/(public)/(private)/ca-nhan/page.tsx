'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Col, Popconfirm, Row, Skeleton } from 'antd';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { ListingStatus, type Listing } from '@tro-oi/shared';

import { deleteListing, getMyListings, updateListing } from '@/api/listings';
import { ProfileHeader, ProfileListings, ProfileReviews } from '@/components/sections';
import { useAuthStore, useRequireUser } from '@/stores/useAuthStore';

import { ProfileEditModal } from './ProfileEditModal';

/** Hồ sơ của tôi: sửa hồ sơ + quản lý tin đăng (sửa / ẩn-hiện / xoá). */
export default function ProfilePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const user = useRequireUser();
  const setUser = useAuthStore((state) => state.setUser);
  const [listings, setListings] = useState<Listing[]>();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleToggleStatus = useCallback(
    async (listing: Listing) => {
      const status =
        listing.status === ListingStatus.ACTIVE ? ListingStatus.CLOSED : ListingStatus.ACTIVE;
      try {
        const updated = await updateListing(listing.id, { status });
        setListings((current) => current?.map((item) => (item.id === updated.id ? updated : item)));
        message.success(status === ListingStatus.ACTIVE ? 'Đã hiển thị lại tin' : 'Đã ẩn tin');
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message],
  );

  const handleDelete = useCallback(
    async (listing: Listing) => {
      try {
        await deleteListing(listing.id);
        setListings((current) => current?.filter((item) => item.id !== listing.id));
        message.success('Đã xoá tin');
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message],
  );

  const renderActions = useCallback(
    (listing: Listing) => (
      <>
        <Link href={`/dang-tin?id=${listing.id}`}>
          <Button size="small" icon={<Pencil size={14} />}>
            Sửa
          </Button>
        </Link>
        <Button
          size="small"
          icon={listing.status === ListingStatus.ACTIVE ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={() => handleToggleStatus(listing)}
        >
          {listing.status === ListingStatus.ACTIVE ? 'Ẩn tin' : 'Hiện lại'}
        </Button>
        <Popconfirm
          title="Xoá tin này?"
          description="Tin đã xoá không thể khôi phục."
          okText="Xoá"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(listing)}
        >
          <Button size="small" danger icon={<Trash2 size={14} />}>
            Xoá
          </Button>
        </Popconfirm>
      </>
    ),
    [handleDelete, handleToggleStatus],
  );

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
            renderActions={renderActions}
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
