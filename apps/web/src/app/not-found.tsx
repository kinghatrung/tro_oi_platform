import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Result } from 'antd';

import SubHeader from '@/components/layout/SubHeader';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = { title: 'Không tìm thấy trang' };

/** 404: URL không tồn tại hoặc tin đăng/người dùng đã bị xoá/ẩn. */
export default function NotFound() {
  return (
    <main>
      <SubHeader />
      <section className="w-full max-w-300 mx-auto my-3 rounded-lg bg-surface py-10">
        <Result
          status="404"
          title="Không tìm thấy trang"
          subTitle="Tin đăng có thể đã bị ẩn, bị xoá hoặc đường dẫn không đúng."
          extra={
            <Link href="/tim-kiem">
              <Button type="primary">Tìm trọ khác</Button>
            </Link>
          }
        />
      </section>
      <Footer />
    </main>
  );
}
