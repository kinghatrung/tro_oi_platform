import { Row, Col } from 'antd';

import { ProfileHeader, ProfileListings, ProfileReviews } from '@/components/sections';

export default function ProfilePage() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ProfileHeader />
      </Col>

      <Col span={24}>
        <ProfileListings />
      </Col>

      <Col span={24}>
        <ProfileReviews />
      </Col>
    </Row>
  );
}
