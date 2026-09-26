import Link from 'next/link';

export default function MarketplacePage() {
  return (
    <section className="rounded-xl bg-white p-6">
      <h1 className="text-2xl font-bold">Chợ ơi!</h1>
      <p className="my-4">Chợ mua bán đang được chuẩn bị. Hẹn gặp bạn sớm!</p>
      <Link href="/" className="text-[#16a6a3] hover:underline">
        Về trang chủ
      </Link>
    </section>
  );
}
