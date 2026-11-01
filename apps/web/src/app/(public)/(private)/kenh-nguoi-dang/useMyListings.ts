import { useCallback, useEffect, useState } from 'react';
import { App } from 'antd';
import { ListingStatus, type Listing } from '@tro-oi/shared';

import { deleteListing, getMyListings, updateListing } from '@/api/listings';
import { useRequireUser } from '@/stores/useAuthStore';

/** Tin của tôi + thao tác ẩn/hiện, xoá — dùng chung cho các trang Kênh người đăng. */
export function useMyListings() {
  const { message } = App.useApp();
  const user = useRequireUser();
  const [listings, setListings] = useState<Listing[]>();

  const toggleStatus = useCallback(
    async (listing: Listing) => {
      const status =
        listing.status === ListingStatus.ACTIVE ? ListingStatus.CLOSED : ListingStatus.ACTIVE;
      try {
        const updated = await updateListing(listing.id, { status });
        // PATCH không trả favoriteCount → giữ số cũ
        setListings((current) =>
          current?.map((item) =>
            item.id === updated.id ? { ...updated, favoriteCount: item.favoriteCount } : item,
          ),
        );
        message.success(status === ListingStatus.ACTIVE ? 'Đã hiển thị lại tin' : 'Đã ẩn tin');
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message],
  );

  const remove = useCallback(
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

  useEffect(() => {
    if (!user) return;
    getMyListings()
      .then(setListings)
      .catch((error: Error) => message.error(error.message));
  }, [message, user]);

  return { user, listings, toggleStatus, remove };
}
