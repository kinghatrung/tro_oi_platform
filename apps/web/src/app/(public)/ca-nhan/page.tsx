import Image from 'next/image';
import { Row, Col, Button, Avatar, Flex, Space } from 'antd';
import { Calendar, MapPin, Settings, Camera } from 'lucide-react';

export default function ProfilePage() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <div className="relative h-[200px] w-full ">
          <Image
            src="/images/developer.png"
            alt="Ảnh bìa"
            fill
            className="object-cover rounded-t-lg"
          />
          <Button size="small" className="absolute! right-3 bottom-3 text-[#222]! font-bold!">
            Thay đổi ảnh bìa
          </Button>
        </div>

        <div className="p-5 rounded-b-lg bg-white">
          <Flex gap={20}>
            <div className="relative!">
              <Avatar
                size={138}
                src="https://i.pinimg.com/736x/b1/08/c3/b108c3ad91d76667c45f8b01ff1ad250.jpg"
              />

              <Button
                className="absolute! bottom-0 right-0 rounded-lg!"
                shape="square"
                icon={<Camera />}
              />
            </div>
            <Flex vertical gap={12}>
              <p className="text-primary text-2xl">Minh Huyên</p>
              <Space>
                <Calendar size={20} color="#595959" />
                <p className="text-[16px] text-[#595959]">Đã tham gia: 13 ngày</p>
              </Space>
              <Space size={16}>
                <Space>
                  <MapPin size={20} color="#595959" />
                  <p className="text-[16px] text-[#595959]">Chưa cung cấp</p>
                </Space>
                <Button size="small" icon={<Settings size={20} />}>
                  Chỉnh sửa trang
                </Button>
                <Button size="small">Chia sẻ</Button>
              </Space>
            </Flex>
          </Flex>
        </div>
      </Col>

      <Col span={24}>
        <div className="rounded-lg bg-white py-4 px-5">
          <Flex vertical gap={16}>
            <p className="text-primary text-xl">Tất cả tin đăng (0)</p>
            <Space>
              <Button type="primary" className="h-8!">
                Tin đang hoạt động (0)
              </Button>
              <Button className="btn-gray h-8! text-[#222]!">Đã bán (0)</Button>
            </Space>
            <Space vertical align="center" className="pb-5">
              <div className="relative w-50 h-50">
                <Image
                  alt="Ảnh logo"
                  sizes="200px"
                  fill
                  src="/images/tro-oi-banner-no-logo.svg"
                  className="object-contain"
                />
              </div>

              <p className="text-[#595959] text-sm">Chưa có tin đăng</p>

              <Button type="primary">Đăng tin ngay</Button>
            </Space>
          </Flex>
        </div>
      </Col>

      <Col span={24}>
        <div className="rounded-lg bg-white py-4 px-5">
          <Flex vertical gap={16}>
            <p className="text-primary text-xl">Đánh giá</p>
            <Space>
              <Button type="primary" className="h-8!">
                Tất cả (0)
              </Button>
              <Button className="btn-gray h-8! text-[#222]!">Từ người mua (0)</Button>
              <Button className="btn-gray h-8! text-[#222]!">Từ người bán (0)</Button>
            </Space>
            <Space vertical align="center" className="pb-5">
              <div className="relative w-50 h-50">
                <Image
                  alt="Ảnh logo"
                  sizes="200px"
                  fill
                  src="/images/tro-oi-banner-no-logo.svg"
                  className="object-contain"
                />
              </div>

              <p className="text-[#595959] text-sm">Chưa có đánh giá từ người bán</p>
            </Space>
          </Flex>
        </div>
      </Col>
    </Row>
  );
}
