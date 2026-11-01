import { Col, Row } from 'antd';
import type { ListingStat, PropertyCategory, TransactionType } from '@tro-oi/shared';

import { LocationCard } from '@/components/common';
import { CITIES, NO_IMAGE } from '@/constants';

interface LocationGridProps {
  stats: ListingStat[];
  category: PropertyCategory;
  transaction: TransactionType;
}

/** Featured city + 4 thành phố khác: số tin và ảnh lấy từ stats theo category/transaction đang chọn. */
export function LocationGrid({ stats, category, transaction }: LocationGridProps) {
  const [featured, ...locations] = CITIES.map((city) => {
    const stat = stats.find(
      (item) =>
        item.city === city && item.category === category && item.transaction === transaction,
    );
    return {
      name: city,
      image: stat?.image || NO_IMAGE,
      href: `/tim-kiem?${new URLSearchParams({ transaction, category, city })}`,
      listingCount: stat?.count ?? 0,
    };
  });

  return (
    <Row gutter={[4, 4]} className="rounded-2xl!">
      {/* Featured location */}
      <Col xs={24} md={12}>
        <div className="h-full min-h-64">
          <LocationCard {...featured} featured />
        </div>
      </Col>

      {/* Other locations */}
      <Col xs={24} md={12}>
        <Row gutter={[4, 4]} className="h-full!">
          {locations.map((location) => (
            <Col key={location.name} xs={12}>
              <div className="h-full min-h-30">
                <LocationCard {...location} />
              </div>
            </Col>
          ))}
        </Row>
      </Col>
    </Row>
  );
}
