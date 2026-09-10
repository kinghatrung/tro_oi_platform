import SubHeader from '@/components/layout/SubHeader';
import Footer from '@/components/layout/Footer';

import { BreadcrumbItem } from '@/components/sections';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <SubHeader />
      <BreadcrumbItem />
      <section className="w-full max-w-300 mx-auto pt-16 pb-3">{children}</section>
      <Footer />
    </main>
  );
}
