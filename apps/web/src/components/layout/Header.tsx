'use client';

import Navbar from '@/components/layout/Navbar';
import { SearchInput } from '@/components/sections';

function Header() {
  return (
    <header
      className="relative w-full min-h-55 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/phan1_tren.png')" }}
    >
      <Navbar />
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-full max-w-250 px-4 z-100">
        <SearchInput />
      </div>
    </header>
  );
}

export default Header;
