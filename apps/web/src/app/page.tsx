import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';

export default function Home({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Header />
      <Container />
      <Footer />
    </main>
  );
}
