import Navbar from '@/components/layout/Navbar';
import { SearchInput, type SearchInputProps } from '@/components/sections';
import { loadSiteSettings } from '@/lib/siteSettings';

interface HeaderProps {
  /** Khẩu hiệu riêng; bỏ trống = heroTitle trong thiết lập website. */
  title?: string;
  search?: SearchInputProps;
  /** Ảnh nền banner. */
  heroImage?: string;
}

/** Banner trang chủ / Chợ ơi: thanh điều hướng + khẩu hiệu + ô tìm kiếm. */
async function Header({ title, search, heroImage = '/images/phan1_tren.png' }: HeaderProps) {
  const { heroTitle } = await loadSiteSettings();

  return (
    <header
      className="relative w-full min-h-55 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${heroImage}')` }}
    >
      <Navbar />
      <p className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 text-large">
        {title ?? heroTitle}
      </p>
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-full max-w-250 px-4 z-100">
        <SearchInput {...search} />
      </div>
    </header>
  );
}

export default Header;
