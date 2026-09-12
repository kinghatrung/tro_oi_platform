import Image from 'next/image';
import Link from 'next/link';
import { Col, Flex, Row, Space } from 'antd';
import { FaLinkedin, FaFacebookSquare, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      {/* Top footer */}
      <div className="mx-auto w-full max-w-300 px-4">
        <Row gutter={[32, 32]} className="py-7">
          {/* App */}
          <Col lg={8} md={12} xs={24}>
            <Flex vertical gap={12}>
              <p className="text-sm! text-primary">Tìm trọ trên ứng dụng Trọ ơi</p>

              <Flex align="center" gap={16}>
                {/* QR Code */}
                <Image
                  src="/images/qr-download.png"
                  alt="QR Code Chợ Tốt"
                  width={84}
                  height={84}
                  className="object-contain"
                />

                {/* App Store / Google Play */}
                <Flex vertical gap={8}>
                  <Link href="#" aria-label="Download on App Store">
                    <Image
                      src="/images/appstore-dowload.webp"
                      alt="Download on the App Store"
                      width={115}
                      height={39}
                      className="h-auto w-[115px] object-contain"
                    />
                  </Link>

                  <Link href="#" aria-label="Get it on Google Play">
                    <Image
                      src="/images/googleplay-dowload.webp"
                      alt="Get it on Google Play"
                      width={115}
                      height={39}
                      className="h-auto w-[115px] object-contain"
                    />
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </Col>

          {/* Về Nhà Tốt */}
          <Col lg={8} md={12} xs={24}>
            <Flex vertical gap={12}>
              <p className="text-sm! text-primary">Về Nhà Tốt</p>

              <Space orientation="vertical" size={10}>
                <Link
                  href="/"
                  className="text-sm text-[#595959]! transition-colors hover:text-gray-900"
                >
                  Phòng trọ
                </Link>

                <Link
                  href="/quy-che-hoat-dong-san"
                  className="text-sm text-[#595959]! transition-colors hover:text-gray-900"
                >
                  Căn hộ
                </Link>

                <Link
                  href="/chinh-sach-bao-mat"
                  className="text-sm text-[#595959]! transition-colors hover:text-gray-900"
                >
                  Nguyên căn
                </Link>

                <Link
                  href="/giai-quyet-tranh-chap"
                  className="text-sm text-[#595959]! transition-colors hover:text-gray-900"
                >
                  Tìm người ở ghép
                </Link>
              </Space>
            </Flex>
          </Col>

          {/* Liên kết */}
          <Col lg={8} md={12} xs={24}>
            <Flex vertical gap={12}>
              <p className="text-sm! text-primary">Liên kết</p>
              {/* Social */}
              <Flex gap={8}>
                <Link
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white transition-opacity hover:opacity-80"
                >
                  <FaLinkedin size={32} fill="#0a67c4" />
                </Link>

                <Link
                  href="#"
                  aria-label="YouTube"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF0033] text-white transition-opacity hover:opacity-80"
                >
                  <FaYoutube size={32} fill="#ff0629" color="#ff0629" />
                </Link>

                <Link
                  href="#"
                  aria-label="Facebook"
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1877F2] text-white transition-opacity hover:opacity-80"
                >
                  <FaFacebookSquare size={32} fill="#2c6de4" />
                </Link>
              </Flex>

              {/* Contact */}
              <Space orientation="vertical" size={10}>
                <p className="text-sm text-gray-600">Email: trogiup@trooi.vn</p>

                <p className="text-sm text-gray-600">CSKH: 0123456789(1.000đ/phút)</p>

                <p className="max-w-90 text-sm leading-5 text-gray-600">
                  Địa chỉ: Tầng 18, Tòa nhà UOA, Số 6 đường Tân Trào, Phường Tân Mỹ, Thành phố Hồ
                  Chí Minh, Việt Nam
                </p>
              </Space>
            </Flex>
          </Col>
        </Row>
      </div>

      {/* Bottom footer */}
      <div className="border-t border-gray-200">
        <div className="mx-auto flex w-full max-w-300 items-center justify-between gap-6 px-4 py-6">
          {/* Legal information */}
          <div className="max-w-225">
            <p className="text-xs leading-5 text-gray-500">
              TRỌ ƠI! – Nền tảng tìm kiếm và chia sẻ thông tin phòng trọ, căn hộ và nhà ở.
            </p>

            <p className="text-xs leading-5 text-gray-500">
              Website được xây dựng và phát triển bởi cá nhân với mục tiêu hỗ trợ người dùng tìm
              kiếm nơi ở phù hợp một cách nhanh chóng, thuận tiện và dễ dàng.
            </p>
            <p className="text-xs leading-5 text-gray-500">
              Trọ Ơi! là dự án cá nhân, không đại diện cho bất kỳ tổ chức, doanh nghiệp hoặc sàn
              giao dịch bất động sản nào.{' '}
              <Link
                href="/chinh-sach-su-dung"
                className="text-blue-600! underline! hover:text-blue-700!"
              >
                Chính sách sử dụng
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
