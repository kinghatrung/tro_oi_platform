import type { Listing } from '@tro-oi/shared';

import { SectionNews } from './SectionNews';

/** Displays the latest property rental listings. */
export function RentNews({ items }: { items: Listing[] }) {
  return (
    <SectionNews
      title="Tin cho thuê mới đăng"
      items={items}
      buttonText="Xem thêm tin cho thuê"
      buttonHref="/tim-kiem?transaction=rent-room"
    />
  );
}
