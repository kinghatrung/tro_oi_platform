import { Row, Col, Space, Avatar, Button, Flex, Badge } from 'antd';

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
        <div className="rounded-lg bg-white p-5">hello1</div>
      </Col>

      <Col lg={9} md={24} xs={24}>
        <div className="rounded-lg bg-white p-5">
          <Flex vertical gap={12}>
            <Space>
              <Avatar className="w-12! h-12!" />
              <Space vertical size={0}>
                <p className="text-primary text-[16px]">Minh Huyên</p>
                <p className="text-secondary">Môi giới</p>
              </Space>
            </Space>
            <Space>
              <Badge
                color="#52c41a"
                text={<span className="text-secondary">Hoạt động 37 phút trước</span>}
              />

              <p className="text-secondary">
                Phản hồi: <strong>83%</strong>
              </p>
            </Space>
            <Space>
              <p>16 tin đăng</p>
              <p>6 tháng trên Trọ ơi!</p>
            </Space>
            <Space>
              <Button>Chat</Button>
              <Button>Liên hệ</Button>
            </Space>
          </Flex>
        </div>
      </Col>
    </Row>
  );
}
