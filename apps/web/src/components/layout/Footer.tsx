import Image from 'next/image';
import Link from 'next/link';
import { Col, Flex, Row, Space } from 'antd';

import { CATEGORIES, SUPPORT_EMAIL } from '@/constants';

/** Footer: giới thiệu, link theo loại hình, liên hệ. */
export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-300 px-4">
        <Row gutter={[32, 32]} className="py-7">
          <Col lg={10} md={12} xs={24}>
            <Flex vertical gap={12}>
              <Image
                width={96}
                height={24}
                alt="Trọ ơi"
                src="/images/tro-oi-logo.svg"
                className="h-6 w-auto"
              />
              <p className="max-w-90 text-sm leading-6 text-gray-600">
                Nền tảng tìm kiếm và chia sẻ thông tin phòng trọ, căn hộ, nhà nguyên căn và tìm
                người ở ghép cho sinh viên, người đi làm.
              </p>
            </Flex>
          </Col>

          <Col lg={7} md={12} xs={24}>
            <Flex vertical gap={12}>
              <p className="text-sm! text-primary">Tìm theo loại hình</p>

              <Space orientation="vertical" size={10}>
                {CATEGORIES.map(({ category, title }) => (
                  <Link
                    key={category}
                    href={`/tim-kiem?category=${category}`}
                    className="text-sm text-[#595959]! transition-colors hover:text-gray-900"
                  >
                    {title}
                  </Link>
                ))}
              </Space>
            </Flex>
          </Col>

          <Col lg={7} md={12} xs={24}>
            <Flex vertical gap={12}>
              <p className="text-sm! text-primary">Dành cho người đăng</p>
              <Space orientation="vertical" size={10}>
                <Link href="/dang-tin" className="text-sm text-[#595959]! hover:text-gray-900">
                  Đăng tin miễn phí
                </Link>
                <Link
                  href="/kenh-nguoi-dang"
                  className="text-sm text-[#595959]! hover:text-gray-900"
                >
                  Kênh người đăng
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm text-[#595959]! hover:text-gray-900"
                >
                  Hỗ trợ: {SUPPORT_EMAIL}
                </a>
              </Space>
            </Flex>
          </Col>
        </Row>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto w-full max-w-300 px-4 py-6">
          <p className="text-xs leading-5 text-gray-500">
            Trọ Ơi! là dự án cá nhân, không đại diện cho bất kỳ tổ chức, doanh nghiệp hoặc sàn giao
            dịch bất động sản nào. Thông tin tin đăng do người dùng cung cấp.
          </p>
        </div>
      </div>
    </footer>
  );
}
