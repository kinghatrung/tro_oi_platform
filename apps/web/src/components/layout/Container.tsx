'use client';

import { Property } from '@/components/sections';

/**
 * Container component that wraps the Property section with a background image.
 * Provides centered layout with maximum width constraint.
 */
export default function Container() {
  return (
    <section
      className="w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/phan2_duoi.png')" }}
    >
      <div className="w-full max-w-300 mx-auto pt-16">
        <Property />
      </div>
    </section>
  );
}
