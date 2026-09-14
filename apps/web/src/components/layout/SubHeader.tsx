'use client';

import Navbar from '@/components/layout/Navbar';
import { SearchInput } from '@/components/sections';

/**
 * Header component that displays the navigation bar and search input.
 * Includes a background image and positions the search input at the bottom center.
 */
function SubHeader() {
  return (
    <header className="w-full bg-white">
      <Navbar />
    </header>
  );
}

export default SubHeader;
