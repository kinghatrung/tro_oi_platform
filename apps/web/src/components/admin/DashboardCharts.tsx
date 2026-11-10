'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { formatNumber } from '@/utils/helpers';

/* Biểu đồ SVG tự vẽ cho trang tổng quan quản trị — theo quy tắc trong skill dataviz:
   line 2px, bar ≤ 24px bo 4px ở đầu dữ liệu, lưới hairline mờ, chữ dùng token chữ (không tô màu chuỗi). */

export interface ChartSeries<TKey extends string> {
  key: TKey;
  label: string;
  /** Biến CSS màu chuỗi, vd var(--series-1). */
  color: string;
}

/** Bước chia trục Y "đẹp" (1, 2, 5 × 10^n) cho ~4 vạch. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * power).find((value) => value >= rough) ?? rough;
  return step * 4;
}

/** Chiều rộng thật của phần tử (SVG vẽ theo pixel, không co giãn chữ/nét). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const formatDay = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

interface LineChartProps<
  TKey extends string,
  TRow extends { date: string } & Record<TKey, number>,
> {
  rows: TRow[];
  series: ChartSeries<TKey>[];
  height?: number;
}

/**
 * Biểu đồ đường theo ngày, nhiều chuỗi chung 1 trục Y. Rê chuột / phím ←→ → đường dọc + tooltip
 * liệt kê mọi chuỗi tại ngày đó.
 */
export function LineChart<
  TKey extends string,
  TRow extends { date: string } & Record<TKey, number>,
>({ rows, series, height = 260 }: LineChartProps<TKey, TRow>) {
  const [containerRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const padding = { top: 12, right: 12, bottom: 28, left: 36 };
  const plotWidth = Math.max(width - padding.left - padding.right, 0);
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = niceMax(Math.max(0, ...rows.flatMap((row) => series.map((s) => row[s.key]))));
  const x = (index: number) =>
    padding.left + (rows.length > 1 ? (index / (rows.length - 1)) * plotWidth : plotWidth / 2);
  const y = (value: number) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const ticks = [0, 1, 2, 3, 4].map((step) => (maxValue / 4) * step);
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));

  const pickIndex = (event: PointerEvent<SVGSVGElement>) => {
    const left = event.currentTarget.getBoundingClientRect().left;
    const ratio = (event.clientX - left - padding.left) / (plotWidth || 1);
    setActive(Math.min(rows.length - 1, Math.max(0, Math.round(ratio * (rows.length - 1)))));
  };
  const handleKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -1 : 1;
    setActive((current) =>
      Math.min(rows.length - 1, Math.max(0, (current ?? rows.length - 1) + step)),
    );
  };
  const activeRow = active === null ? null : rows[active];

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Biểu đồ ${series.map((s) => s.label).join(', ')} theo ngày. Dùng phím mũi tên trái phải để xem từng ngày.`}
          tabIndex={0}
          className="touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onPointerMove={pickIndex}
          onPointerDown={pickIndex}
          onPointerLeave={() => setActive(null)}
          onKeyDown={handleKey}
          onBlur={() => setActive(null)}
        >
          {/* Lưới + nhãn trục Y */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-subtle text-[11px] tabular-nums"
              >
                {formatNumber(tick)}
              </text>
            </g>
          ))}
          {/* Nhãn trục X */}
          {rows.map((row, index) =>
            index % labelEvery === 0 || index === rows.length - 1 ? (
              <text
                key={row.date}
                x={x(index)}
                y={height - 8}
                textAnchor={index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'}
                className="fill-subtle text-[11px] tabular-nums"
              >
                {formatDay(row.date)}
              </text>
            ) : null,
          )}
          {/* Đường dọc theo con trỏ */}
          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke="var(--line-strong)"
              strokeWidth={1}
            />
          )}
          {/* Chuỗi dữ liệu */}
          {series.map((s) => (
            <polyline
              key={s.key}
              points={rows.map((row, index) => `${x(index)},${y(row[s.key])}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {activeRow &&
            series.map((s) => (
              <circle
                key={s.key}
                cx={x(active!)}
                cy={y(activeRow[s.key])}
                r={4.5}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
        </svg>
      )}
      {activeRow && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-surface px-3 py-2 shadow-md"
          style={
            x(active!) > width / 2 ? { right: width - x(active!) + 12 } : { left: x(active!) + 12 }
          }
        >
          <p className="mb-1 text-xs text-subtle">{formatDay(activeRow.date)}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2 text-sm">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
              <b className="text-ink tabular-nums">{formatNumber(activeRow[s.key])}</b>
              <span className="text-body">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chú giải: vạch màu (cùng dạng mark đường) + tên chuỗi. */
export function ChartLegend({ series }: { series: ChartSeries<string>[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-2 text-sm text-body">
          <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

export interface ChartPart {
  key: string;
  label: string;
  value: number;
  /** Màu mark (biến CSS); chữ không bao giờ dùng màu này. */
  color: string;
  /** Màu chữ in trên khối màu: trắng, riêng nền vàng/cảnh báo dùng gần đen. */
  onColor?: string;
  /** Icon trạng thái (cặp icon + nhãn, không để màu đứng một mình). */
  icon?: ReactNode;
  /** Bấm → trang quản lý đã lọc. */
  href?: string;
}

const percent = (value: number, total: number) => (total ? Math.round((value / total) * 100) : 0);

/**
 * Một tổng thể chia phần, đặt liền nhau, cách 2px. `tall`: cao 28px, in % trong khối khi đủ chỗ
 * (dùng một mình trong thẻ); mặc định mảnh 8px không chữ (đặt trên danh sách có số).
 */
export function SegmentedBar({ parts, tall = false }: { parts: ChartPart[]; tall?: boolean }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  const visible = parts.filter((part) => part.value > 0);
  if (total === 0) return <div className={`rounded-full bg-soft ${tall ? 'h-7' : 'h-2'}`} />;
  return (
    <div
      role="img"
      aria-label={visible
        .map(
          (part) => `${part.label}: ${formatNumber(part.value)} (${percent(part.value, total)}%)`,
        )
        .join(', ')}
      className={`flex gap-0.5 ${tall ? 'h-7' : 'h-2'}`}
    >
      {visible.map((part) => {
        const share = percent(part.value, total);
        return (
          <div
            key={part.key}
            title={`${part.label}: ${formatNumber(part.value)} (${share}%)`}
            className={`flex min-w-1 items-center overflow-hidden ${tall ? 'rounded px-2' : 'rounded-full'}`}
            style={{ flexGrow: part.value, flexBasis: 0, background: part.color }}
          >
            {/* Khối hẹp không in chữ (không cắt chữ) — số vẫn có ở chú giải / tooltip */}
            {tall && share >= 12 && (
              <span className="text-xs font-semibold" style={{ color: part.onColor ?? '#ffffff' }}>
                {share}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Chú giải dạng ô màu + tên (đi kèm SegmentedBar cao — không lặp lại số). */
export function PartLegend({ parts }: { parts: ChartPart[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {parts.map((part) => (
        <li key={part.key} className="flex items-center gap-1.5 text-sm text-body">
          <span className="size-2.5 rounded-sm" style={{ background: part.color }} />
          {part.label}
        </li>
      ))}
    </ul>
  );
}

/** Cơ cấu kèm số: thanh mảnh ở trên + từng dòng (icon/ô màu, nhãn, số, %). */
export function CompositionList({ parts }: { parts: ChartPart[] }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div className="flex flex-col gap-4">
      <SegmentedBar parts={parts} />
      <ul className="flex flex-col">
        {parts.map((part) => {
          const row = (
            <span className="flex items-center gap-2.5 py-1.5 text-sm">
              <span
                className="flex size-4 shrink-0 items-center justify-center"
                style={{ color: part.color }}
              >
                {part.icon ?? (
                  <span className="size-2.5 rounded-sm" style={{ background: part.color }} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-body">{part.label}</span>
              <b className="text-ink tabular-nums">{formatNumber(part.value)}</b>
              <span className="w-10 text-right text-xs text-subtle tabular-nums">
                {percent(part.value, total)}%
              </span>
            </span>
          );
          return (
            <li key={part.key} className="border-b border-line last:border-b-0">
              {part.href ? (
                <Link href={part.href} className="block rounded hover:bg-soft">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface ChartItem {
  key: string;
  label: string;
  value: number;
}

/** Biểu đồ cột 1 chuỗi: cột ≤ 24px bo 4px ở đỉnh, số trên đỉnh, nhãn dưới (xuống dòng được). */
export function ColumnChart({ items, height = 180 }: { items: ChartItem[]; height?: number }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="flex items-end gap-2" role="list">
      {items.map((item) => (
        <div
          key={item.key}
          role="listitem"
          title={`${item.label}: ${formatNumber(item.value)}`}
          className="flex min-w-0 flex-1 flex-col items-center"
        >
          <span className="mb-1 text-sm font-semibold text-ink tabular-nums">
            {formatNumber(item.value)}
          </span>
          <div
            className="flex w-full justify-center border-b border-line-strong"
            style={{ height }}
          >
            <div
              className="mt-auto w-6 max-w-full rounded-t bg-brand transition-[height] duration-500"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          {/* Cao cố định 2 dòng: nhãn dài không đẩy đáy cột lệch nhau */}
          <span className="mt-2 line-clamp-2 h-8 text-center text-xs leading-4 text-body">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Xếp hạng dạng lollipop có điểm nhấn: mục đứng đầu màu thương hiệu, còn lại xám —
 * câu chuyện là "ai dẫn đầu", không phải phân biệt từng mục.
 */
export function Lollipop({ items }: { items: ChartItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ol className="flex flex-col gap-3.5">
      {items.map((item, index) => {
        const color = index === 0 ? 'var(--brand)' : 'var(--subtle)';
        return (
          <li
            key={item.key}
            title={`${item.label}: ${formatNumber(item.value)}`}
            className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"
          >
            <span className={`truncate ${index === 0 ? 'font-semibold text-ink' : 'text-body'}`}>
              {item.label}
            </span>
            <span className="relative flex h-3 items-center">
              <span
                className="h-0.5 rounded-full"
                style={{ width: `${(item.value / max) * 100}%`, background: color }}
              />
              <span
                className="absolute size-3 -translate-x-1/2 rounded-full ring-2 ring-surface"
                style={{ left: `${(item.value / max) * 100}%`, background: color }}
              />
            </span>
            <b className="w-8 text-right text-ink tabular-nums">{formatNumber(item.value)}</b>
          </li>
        );
      })}
    </ol>
  );
}

/** Đường xu hướng nhỏ trong thẻ số liệu (màu nhấn mờ, không trục). */
export function Sparkline({
  values,
  color = 'var(--brand)',
}: {
  values: number[];
  color?: string;
}) {
  const width = 96;
  const height = 32;
  const max = Math.max(1, ...values);
  const points = values
    .map((value, index) => {
      const px = values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
      return `${px},${height - 2 - (value / max) * (height - 4)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} aria-hidden className="shrink-0 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}
