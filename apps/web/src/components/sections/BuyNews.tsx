import type { Listing } from '@tro-oi/shared';

import { SectionNews } from './SectionNews';

/** Displays the latest property sale listings. */
export function BuyNews({ items }: { items: Listing[] }) {
  return (
    <SectionNews
      title="Tin mua bán mới đăng"
      items={items}
      buttonText="Xem thêm tin mua bán"
      buttonHref="/tim-kiem?transaction=buy-room"
    />
  );
}
