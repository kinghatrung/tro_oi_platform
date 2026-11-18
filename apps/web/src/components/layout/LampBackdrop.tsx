import type { CSSProperties } from 'react';

/** Mỗi bóng: độ dài dây (px), độ trễ lúc bật (giây), chu kỳ đung đưa (giây). */
const LAMPS = {
  left: [
    { cord: 170, delay: 0, swing: 6.4 },
    { cord: 250, delay: 0.35, swing: 7.6 },
    { cord: 130, delay: 0.7, swing: 5.6 },
  ],
  right: [
    { cord: 210, delay: 0.2, swing: 7 },
    { cord: 140, delay: 0.55, swing: 6 },
    { cord: 260, delay: 0.9, swing: 8 },
  ],
};

/** Bóng đèn sợi đốt: thân thuỷ tinh + dây tóc (viewBox 40×56, đui ở trên). */
const GLASS = 'M14 10h12v5c0 3 10 7 10 18a16 16 0 1 1-32 0c0-11 10-15 10-18z';
const FILAMENT = 'M15 31c1.5-5 3.5-5 5 0s3.5 5 5 0';

function Bulb({ lit }: { lit?: boolean }) {
  return (
    <svg viewBox="0 0 40 56" className={lit ? 'lamp-svg lamp-svg-lit' : 'lamp-svg'}>
      {!lit && <rect x="13" y="0" width="14" height="11" rx="2" className="lamp-socket" />}
      <path d={GLASS} className="lamp-glass" />
      <path d={FILAMENT} className="lamp-filament" />
    </svg>
  );
}

/** 1 bóng treo: dây + bóng tắt + lớp "đang sáng" (hiện ở giao diện tối). */
function Lamp({ className, style }: { className?: string; style: CSSProperties }) {
  return (
    <div className={className ? `lamp ${className}` : 'lamp'} style={style}>
      <span className="lamp-cord" />
      <div className="lamp-bulb">
        <span className="lamp-light">
          <span className="lamp-halo" />
          <Bulb lit />
        </span>
        <Bulb />
      </div>
    </div>
  );
}

const lampVars = (vars: Record<string, string>) => vars as CSSProperties;

/**
 * Nền trang trí: bóng đèn treo ở 2 lề (sau nội dung, không bắt chuột).
 * Giao diện sáng = đèn tắt, giao diện tối = đèn chập chờn rồi sáng (globals.css, mục "Bóng đèn treo").
 */
export function LampBackdrop() {
  return (
    <div className="lamp-backdrop" aria-hidden>
      {(['left', 'right'] as const).map((side) => (
        <div key={side} className={`lamp-side lamp-side-${side}`}>
          {LAMPS[side].map(({ cord, delay, swing }, index) => (
            <Lamp
              key={index}
              style={lampVars({
                '--cord': `${cord}px`,
                '--delay': `${delay}s`,
                '--swing': `${swing}s`,
              })}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dây đèn trên banner: mắc dọc mép dưới menu, võng thành nhiều đoạn đều nhau (toạ độ x theo %). */
const SWAG_COUNT = 8;
/** Vị trí bóng trên mỗi đoạn (0 = móc trái, 1 = móc phải). */
const STOPS = [0.25, 0.5, 0.75];
const WIRE_TOP = 3;
/** Độ võng (px): 2 đoạn giữa nông hơn để bóng không đè khẩu hiệu. */
const sagOf = (swag: number) => (swag === 3 || swag === 4 ? 5 : 13);
const SWAGS = Array.from({ length: SWAG_COUNT }, (_, swag) => ({
  from: (swag * 100) / SWAG_COUNT,
  to: ((swag + 1) * 100) / SWAG_COUNT,
  sag: sagOf(swag),
}));
const BULB_COUNT = SWAG_COUNT * STOPS.length;

/**
 * Dây đèn trang trí trong banner (Header.tsx) — cùng kiểu bóng với LampBackdrop.
 * Bật ở giao diện tối thành làn sóng từ 2 mép vào giữa.
 */
export function HeroLights() {
  return (
    <div className="hero-lights" aria-hidden>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="hero-lights-wire">
        {SWAGS.map(({ from, to, sag }) => (
          <path
            key={from}
            // Bézier bậc 2: điểm điều khiển sâu 2×sag → đáy dây võng đúng sag
            d={`M${from} ${WIRE_TOP} Q${(from + to) / 2} ${WIRE_TOP + 2 * sag} ${to} ${WIRE_TOP}`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {SWAGS.map(({ from }) => (
        <span key={from} className="hero-lights-hook" style={{ left: `${from}%` }} />
      ))}
      <span className="hero-lights-hook" style={{ left: '100%' }} />
      {SWAGS.map(({ from, to, sag }, swag) =>
        STOPS.map((t, index) => {
          const bulb = swag * STOPS.length + index;
          return (
            <Lamp
              key={bulb}
              className="hero-lamp-bulb"
              style={lampVars({
                left: `${from + (to - from) * t}%`,
                top: `${WIRE_TOP + 4 * sag * t * (1 - t)}px`,
                '--cord': '5px',
                '--delay': `${0.15 + Math.min(bulb, BULB_COUNT - 1 - bulb) * 0.1}s`,
                '--swing': `${3.2 + (bulb % 3) * 0.7}s`,
              })}
            />
          );
        }),
      )}
    </div>
  );
}
