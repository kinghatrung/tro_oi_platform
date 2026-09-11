'use client';

import { Row, Col } from 'antd';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <Row gutter={[16, 16]}>
      <Col lg={15} md={24} xs={24}>
        <div className="rounded-lg bg-white p-5">hello1</div>
      </Col>

      <Col lg={9} md={24} xs={24}>
        <div className="rounded-lg bg-white p-5">hello2</div>
      </Col>
    </Row>
  );
}
