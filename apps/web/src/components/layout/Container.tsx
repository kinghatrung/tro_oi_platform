'use client';

import { Property, BuyNews, RentNews, AreaNews } from '@/components/sections';

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
      </div>
    </section>
  );
}
