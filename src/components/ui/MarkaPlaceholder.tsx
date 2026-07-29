import { tohum } from "@/lib/utils";
import { oranSayisal, type Oran } from "@/lib/images";

/**
 * AI görseli henüz üretilmemiş anahtarlar için markaya uygun, kararlı bir SVG.
 * Anahtardan türetilen tohum sayesinde her build'de aynı kompozisyonu çizer —
 * yani "eksik görsel" gibi değil, kasıtlı bir marka deseni gibi görünür.
 */
export function MarkaPlaceholder({
  anahtar,
  oran = "16/9",
  className,
}: {
  anahtar: string;
  oran?: Oran;
  className?: string;
}) {
  const t = tohum(anahtar);
  const g = 1200;
  const y = Math.round(g / oranSayisal(oran));
  const id = `ph-${(t % 100000).toString(36)}`;

  // Tohumdan türeyen kararlı varyasyonlar
  const donme = (t % 24) - 12;
  const ikonIndex = t % IKONLAR.length;
  const daireler = Array.from({ length: 5 }, (_, i) => {
    const s = tohum(`${anahtar}-${i}`);
    return {
      cx: (s % 90) + 5,
      cy: ((s >> 5) % 80) + 10,
      r: ((s >> 9) % 12) + 4,
      o: 0.08 + ((s >> 13) % 10) / 60,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${g} ${y}`}
      className={className}
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-zemin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE79A" />
          <stop offset="45%" stopColor="#FFC93A" />
          <stop offset="100%" stopColor="#F0A500" />
        </linearGradient>
        <radialGradient id={`${id}-isik`} cx="30%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#FFF9EF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFF9EF" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${id}-nokta`}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill="#241608" opacity="0.14" />
        </pattern>
      </defs>

      <rect width={g} height={y} fill={`url(#${id}-zemin)`} />
      <rect width={g} height={y} fill={`url(#${id}-nokta)`} />
      <rect width={g} height={y} fill={`url(#${id}-isik)`} />

      {daireler.map((d, i) => (
        <circle
          key={i}
          cx={(d.cx / 100) * g}
          cy={(d.cy / 100) * y}
          r={(d.r / 100) * g * 0.35}
          fill="#241608"
          opacity={d.o * 0.35}
        />
      ))}

      {/* Logodaki gibi yumuşak, eğimli alt bant */}
      <path
        d={`M0 ${y * 0.82} Q ${g * 0.3} ${y * 0.72} ${g * 0.62} ${y * 0.8} T ${g} ${y * 0.74} L ${g} ${y} L 0 ${y} Z`}
        fill="#241608"
        opacity="0.1"
      />

      <g
        transform={`translate(${g / 2} ${y / 2}) rotate(${donme}) scale(${(Math.min(g, y) / 260).toFixed(3)})`}
        fill="none"
        stroke="#3B2412"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.72"
      >
        {IKONLAR[ikonIndex]}
      </g>
    </svg>
  );
}

/** Marka evrenine ait basit çizgi ikonları — hepsi 200x200 kutusunda ortalı. */
const IKONLAR = [
  // Kapaklı servis tabağı
  <g key="tabak">
    <path d="M-80 30 H80" />
    <path d="M-64 30 a64 64 0 0 1 128 0" />
    <path d="M0 -34 v-14" />
  </g>,
  // Konum pini
  <g key="pin">
    <path d="M0 60 C0 60 -46 6 -46 -22 a46 46 0 0 1 92 0 C46 6 0 60 0 60 Z" />
    <circle cx="0" cy="-22" r="16" />
  </g>,
  // Scooter
  <g key="scooter">
    <circle cx="-48" cy="34" r="22" />
    <circle cx="52" cy="34" r="22" />
    <path d="M-48 34 H10 l16 -54 h-30" />
    <path d="M26 -20 h34 v40" />
    <path d="M52 12 V-30 h26" />
  </g>,
  // Alışveriş poşeti
  <g key="poset">
    <path d="M-52 -22 h104 l-10 84 h-84 Z" />
    <path d="M-24 -22 v-14 a24 24 0 0 1 48 0 v14" />
  </g>,
  // Grafik / veri
  <g key="grafik">
    <path d="M-62 46 V-46" />
    <path d="M-62 46 H62" />
    <path d="M-38 20 v18" />
    <path d="M-8 -4 v42" />
    <path d="M22 12 v26" />
    <path d="M52 -26 v64" />
  </g>,
  // Zaman / hız
  <g key="saat">
    <circle cx="0" cy="0" r="52" />
    <path d="M0 -28 V4 l22 14" />
  </g>,
];
