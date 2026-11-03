import Image from 'next/image';
import Link from 'next/link';
import { Col, Flex, Row, Space } from 'antd';

import { CATEGORIES } from '@/constants';
import { loadSiteSettings } from '@/lib/siteSettings';

/** Footer: giới thiệu, link theo loại hình, liên hệ. */
export default async function Footer() {
  const settings = await loadSiteSettings();

  return (
    <footer className="w-full border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-300 px-4">
        <Row gutter={[32, 32]} className="py-7">
          <Col lg={10} md={12} xs={24}>
            <Flex vertical gap={12}>
              <Image
                width={96}
                height={24}
                alt={settings.siteName}
                src={settings.logoUrl}
                className="brand-art"
              />
              <p className="max-w-90 text-sm leading-6 text-body">
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
                    className="text-sm text-body! transition-colors hover:text-ink"
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
                <Link href="/dang-tin" className="text-sm text-body! hover:text-ink">
                  Đăng tin miễn phí
                </Link>
                <Link href="/kenh-nguoi-dang" className="text-sm text-body! hover:text-ink">
                  Kênh người đăng
                </Link>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-sm text-body! hover:text-ink"
                >
                  Hỗ trợ: {settings.contactEmail}
                </a>
                {settings.contactPhone && (
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="text-sm text-body! hover:text-ink"
                  >
                    Hotline: {settings.contactPhone}
                  </a>
                )}
              </Space>
            </Flex>
          </Col>
        </Row>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto w-full max-w-300 px-4 py-6">
          <p className="text-xs leading-5 text-subtle whitespace-pre-line">
            {settings.footerText ||
              `© ${new Date().getFullYear()} ${settings.siteName}. Thông tin tin đăng do người dùng cung cấp.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
