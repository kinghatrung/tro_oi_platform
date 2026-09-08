import { Button, Space } from 'antd';

import Navbar from '@/components/layout/Navbar';
import { SearchInput } from '@/components/sections';

/**
 * Header component that displays the navigation bar and search input.
 * Includes a background image and positions the search input at the bottom center.
 */
function Header() {
  return (
    <header
      className="relative w-full min-h-55 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/phan1_tren.png')" }}
    >
      <Navbar />
      <p className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 text-large">
        Nhà vừa ý, giá hợp lý!
      </p>
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-full max-w-250 px-4 z-100">
        <SearchInput />
      </div>
    </header>
  );
}

export default Header;
