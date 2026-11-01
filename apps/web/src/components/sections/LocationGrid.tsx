import { Col, Row } from 'antd';
import type { ListingStat, PropertyCategory, TransactionType } from '@tro-oi/shared';

import { LocationCard } from '@/components/common';
import { CITIES } from '@/constants';

interface LocationGridProps {
  stats: ListingStat[];
  category: PropertyCategory;
  transaction: TransactionType;
}

// shortcut: dùng ảnh chung cho mọi tỉnh, thay khi có ảnh riêng từng thành phố
const CITY_IMAGE = '/images/test.jpg';

/** Featured city + 4 thành phố khác, số tin đếm theo category/transaction đang chọn. */
export function LocationGrid({ stats, category, transaction }: LocationGridProps) {
  const [featured, ...locations] = CITIES.map((city) => ({
    name: city,
    image: CITY_IMAGE,
    href: `/tim-kiem?${new URLSearchParams({ transaction, category, city })}`,
    listingCount: stats
      .filter(
        (stat) =>
          stat.city === city && stat.category === category && stat.transaction === transaction,
      )
      .reduce((sum, stat) => sum + stat.count, 0),
  }));

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
