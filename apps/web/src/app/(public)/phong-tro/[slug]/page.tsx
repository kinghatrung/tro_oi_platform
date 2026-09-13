import { Row, Col } from 'antd';

import { SectionNews, AgentCard, PropertyOverview } from '@/components/sections';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DetailPage({ params }: PageProps) {
  const { slug } = await params;

  console.log(slug);

  return (
    <Row gutter={[16, 16]}>
      <Col lg={15} md={24} xs={24}>
        <PropertyOverview />
      </Col>

      <Col lg={9} md={24} xs={24}>
        <AgentCard />
      </Col>

      <Col lg={24} md={24} xs={24}>
        <SectionNews
          title="Tin đăng tương tự"
          buttonText="Xem thêm"
          classButton="w-75!"
          className="mb-0!"
        />
      </Col>

      <Col lg={24} md={24} xs={24}>
        <SectionNews
          title="Tin rao khác của Minh Huyên"
          buttonText="Xem thêm"
          classButton="w-75!"
        />
      </Col>
    </Row>
  );
}
