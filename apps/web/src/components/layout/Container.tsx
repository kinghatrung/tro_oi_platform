import { Property, BuyNews, RentNews, AreaNews } from '@/components/sections';
import Image from 'next/image';
/**
 * Container component that wraps the Property section with a background image.
 * Provides centered layout with maximum width constraint.
 */
export default function Container() {
  return (
    <section
      className="w-full bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/phan2_duoi.png')" }}
    >
      <div className="w-full max-w-300 mx-auto pt-16 pb-3">
        <Property />
        <BuyNews />
        <RentNews />
        <AreaNews />
        <div className="bg-white mb-4">
          <Image width={1200} height={330} alt="Ảnh banner" src="/images/banner.png" />
        </div>
      </div>
    </section>
  );
}
