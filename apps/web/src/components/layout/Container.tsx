import { TransactionType } from '@tro-oi/shared';

import { Property, BuyNews, RentNews, AreaNews, Promote } from '@/components/sections';
import { getListingStats, searchListings } from '@/api/listings';

const LATEST_COUNT = 10;

/** Nội dung trang chủ: loại hình, tin mới (cho thuê/mua bán), khu vực, banner. */
export default async function Container() {
  const [stats, rent, buy] = await Promise.all([
    getListingStats(),
    searchListings({ transaction: TransactionType.RENT, pageSize: LATEST_COUNT }),
    searchListings({ transaction: TransactionType.BUY, pageSize: LATEST_COUNT }),
  ]);

  return (
    <section
      className="w-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/test2.png')" }}
    >
      <div className="w-full max-w-300 mx-auto pt-16 pb-3">
        <Property stats={stats} />
        <RentNews items={rent.items} />
        <BuyNews items={buy.items} />
        <AreaNews stats={stats} />
        <Promote />
      </div>
    </section>
  );
}
