import Navbar from '@/components/layout/Navbar';

/** Header của các trang con: chỉ có thanh điều hướng (không có ô tìm kiếm lớn như trang chủ). */
function SubHeader() {
  return (
    <header className="w-full bg-surface">
      <Navbar />
    </header>
  );
}

export default SubHeader;
