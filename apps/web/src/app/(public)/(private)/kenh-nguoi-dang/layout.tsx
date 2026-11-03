import type { Metadata } from 'next';
import { Col, Row } from 'antd';

import { SellerSidebar } from './SellerSidebar';

export const metadata: Metadata = {
  title: 'Kênh người đăng',
};

/** Khung Kênh người đăng: sidebar trái + nội dung. */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={5}>
        <SellerSidebar />
      </Col>
      <Col xs={24} lg={19}>
        {children}
      </Col>
    </Row>
  );
}
