import { useEffect, useState } from 'react';

type WardsByProvince = Record<string, string[]>;

// Tải 1 lần cho cả trang (~64KB, tách chunk riêng) — chỉ khi có ô chọn phường/xã
let wardsPromise: Promise<WardsByProvince> | undefined;
const loadWards = () =>
  (wardsPromise ??= import('@/constants/wards.json').then(
    (module) => module.default as WardsByProvince,
  ));

/** Phường/xã/đặc khu của 1 tỉnh/thành (sắp theo ABC); chưa chọn tỉnh hoặc đang tải → []. */
export function useWards(province?: string) {
  const [wardsByProvince, setWardsByProvince] = useState<WardsByProvince>();

  useEffect(() => {
    if (!province || wardsByProvince) return;
    let cancelled = false;
    void loadWards().then((data) => {
      if (!cancelled) setWardsByProvince(data);
    });
    return () => {
      cancelled = true;
    };
  }, [province, wardsByProvince]);

  return (province && wardsByProvince?.[province]) || [];
}
