'use client';

import { Property } from '@/components/sections';

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
