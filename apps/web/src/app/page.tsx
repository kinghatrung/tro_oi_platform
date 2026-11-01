import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';

// Dữ liệu tin đăng thay đổi liên tục, không prerender lúc build
export const dynamic = 'force-dynamic';

/** Renders the public home page. */
export default function Home() {
  return (
    <main>
      <Header />
      <Container />
      <Footer />
    </main>
  );
}
