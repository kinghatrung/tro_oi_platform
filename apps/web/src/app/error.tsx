'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useTransition } from 'react';
import { App, Button } from 'antd';
import { Copy, House, Mail, RotateCw, Wifi, Zap } from 'lucide-react';

import { useSiteSettings } from './providers';

interface ErrorPageProps {
  error: Error & { digest?: string };
  /** Tải lại dữ liệu + render lại đoạn bị lỗi (Next ≥ 16.3; `reset` chỉ render lại, không fetch lại). */
  retry: () => void;
}

/** Căn trọ "cúp điện": nhà tắt đèn, dây điện tuột phích đung đưa, tia lửa nhấp nháy. */
function PowerOutageArt() {
  return (
    <svg
      viewBox="0 0 320 260"
      role="img"
      aria-label="Căn trọ bị cúp điện"
      className="w-full max-w-80"
    >
      <ellipse cx="150" cy="226" rx="132" ry="14" fill="var(--soft)" />
      {/* Cột điện */}
      <rect x="262" y="58" width="8" height="168" rx="3" fill="var(--line-strong)" />
      <rect x="248" y="70" width="36" height="6" rx="3" fill="var(--line-strong)" />
      {/* Nhà */}
      <rect x="62" y="56" width="18" height="40" rx="3" fill="var(--brand-dark)" />
      <rect
        x="52"
        y="112"
        width="180"
        height="112"
        rx="10"
        fill="var(--surface)"
        stroke="var(--brand)"
        strokeWidth="4"
      />
      <path d="M38 120 L142 44 L246 120 Z" fill="var(--brand)" />
      <path
        d="M38 120 L142 44 L246 120"
        fill="none"
        stroke="var(--brand-dark)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Cửa sổ tắt đèn */}
      <rect x="72" y="134" width="44" height="38" rx="5" fill="var(--ink)" opacity="0.78" />
      <rect x="170" y="134" width="44" height="38" rx="5" fill="var(--ink)" opacity="0.78" />
      <path
        d="M78 140 l10 0 M176 140 l10 0"
        stroke="var(--surface)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Cửa */}
      <rect
        x="124"
        y="160"
        width="38"
        height="64"
        rx="5"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth="3"
      />
      <circle cx="153" cy="194" r="3" fill="var(--brand)" />
      {/* Ổ cắm trên tường */}
      <rect
        x="226"
        y="148"
        width="18"
        height="24"
        rx="4"
        fill="var(--surface)"
        stroke="var(--line-strong)"
        strokeWidth="3"
      />
      <circle cx="235" cy="156" r="2" fill="var(--body)" />
      <circle cx="235" cy="164" r="2" fill="var(--body)" />
      {/* Dây điện tuột phích, đung đưa từ đỉnh cột */}
      <g className="error-swing">
        <path
          d="M266 72 C 300 120, 290 170, 262 190"
          fill="none"
          stroke="var(--body)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect
          x="248"
          y="186"
          width="20"
          height="14"
          rx="3"
          fill="var(--body)"
          transform="rotate(-25 258 193)"
        />
        <path
          d="M246 186 l-8 -4 M248 192 l-9 0"
          stroke="var(--body)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Tia lửa: màu trạng thái (vàng) — ngoại lệ cho phép trong coding-rules */}
        <path
          className="error-flicker"
          d="M232 176 l-10 8 l8 2 l-8 10"
          fill="none"
          stroke="#f5b301"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Lỗi khi render/fetch phía server (thường do API không phản hồi). */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const { message } = App.useApp();
  const { logoUrl, siteName, contactEmail } = useSiteSettings();
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleRetry = () => startRetry(() => retry());

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(error.digest ?? '');
      message.success('Đã sao chép mã lỗi');
    } catch {
      message.error('Không sao chép được, hãy chọn và copy thủ công');
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-page">
      {/* Quầng màu thương hiệu phía sau */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-120 rounded-full bg-brand-soft blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-48 size-110 rounded-full bg-brand-soft blur-3xl" />

      <header className="relative px-6 py-5">
        <Link href="/" aria-label={`Về trang chủ ${siteName}`}>
          <Image src={logoUrl} alt={siteName} width={104} height={26} loading="eager" />
        </Link>
      </header>

      <section className="relative mx-auto flex w-full max-w-250 flex-1 items-center px-4 pb-12">
        <div className="grid w-full items-center gap-8 rounded-3xl bg-surface p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-10 md:grid-cols-[2fr_3fr]">
          <div className="flex justify-center">
            <PowerOutageArt />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Zap size={14} /> Lỗi 500 · Máy chủ chưa phản hồi
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-bold text-ink sm:text-4xl">
              Ối, trọ đang “cúp điện”!
            </h1>
            <p className="mt-3 text-body">
              Trang chưa tải được dữ liệu vì máy chủ đang gặp sự cố. Thợ điện đang sửa rồi — bạn thử
              lại sau ít phút nhé.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="primary"
                size="large"
                icon={<RotateCw size={18} />}
                loading={isRetrying}
                onClick={handleRetry}
              >
                Thử lại
              </Button>
              <Link href="/">
                <Button size="large" icon={<House size={18} />}>
                  Về trang chủ
                </Button>
              </Link>
            </div>

            <div className="mt-8 rounded-2xl bg-soft p-4">
              <p className="text-sm font-semibold text-ink">Trong lúc chờ, bạn có thể:</p>
              <ul className="mt-2 flex flex-col gap-2 text-sm text-body">
                <li className="flex items-start gap-2">
                  <Wifi size={16} className="mt-0.5 shrink-0 text-brand" />
                  Kiểm tra kết nối mạng của bạn.
                </li>
                <li className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span>
                    Lỗi kéo dài? Báo cho chúng tôi qua{' '}
                    <a href={`mailto:${contactEmail}`} className="font-semibold">
                      {contactEmail}
                    </a>
                    {error.digest && ' kèm mã lỗi bên dưới'}.
                  </span>
                </li>
              </ul>
              {error.digest && (
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs text-subtle">
                  Mã lỗi:
                  <code className="rounded bg-surface px-2 py-0.5 font-mono text-ink">
                    {error.digest}
                  </code>
                  <Button
                    type="text"
                    size="small"
                    aria-label="Sao chép mã lỗi"
                    icon={<Copy size={14} />}
                    onClick={copyDigest}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
