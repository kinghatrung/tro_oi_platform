import { Col, Row } from 'antd';

import { LocationCard } from '@/components/common';

interface Location {
  name: string;
  image: string;
  listingCount: number;
  featured?: boolean;
}

const LOCATIONS: Location[] = [
  {
    name: 'Tp Hồ Chí Minh',
    image: '/images/test.jpg',
    listingCount: 287,
    featured: true,
  },
  {
    name: 'Hà Nội',
    image: '/images/test.jpg',
    listingCount: 54,
  },
  {
    name: 'Đà Nẵng',
    image: '/images/test.jpg',
    listingCount: 26,
  },
  {
    name: 'Cần Thơ',
    image: '/images/test.jpg',
    listingCount: 9,
  },
  {
    name: 'Bình Dương',
    image: '/images/test.jpg',
    listingCount: 70,
  },
];

export function LocationGrid() {
  const [featured, ...locations] = LOCATIONS;

  return (
    <Row gutter={[4, 4]} className="rounded-2xl!">
      {/* Featured location */}
      <Col xs={24} md={12}>
        <div className="h-full min-h-64">
          <LocationCard {...featured} />
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
