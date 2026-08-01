import { cn } from "@/lib/utils";

/**
 * Marketlerdeki kırmızı plastik el sepeti — çizgi ikon değil, renkli bir çizim.
 *
 * Ağzı bilerek açık ve içi koyu çizildi: sepete uçan ürün son anda bu karanlık
 * ağza doğru inip kaybolduğu için gerçekten içine düşmüş gibi görünüyor
 * (bkz. SepeteUcus.ts).
 */
export function ElSepeti({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 44" fill="none" aria-hidden="true" className={cn("block", className)}>
      <defs>
        <linearGradient id="nySepetGovde" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0523a" />
          <stop offset="1" stopColor="#b8321d" />
        </linearGradient>
        <linearGradient id="nySepetAgiz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6a4f" />
          <stop offset="1" stopColor="#d63d24" />
        </linearGradient>
      </defs>

      {/* Ağzın üstüne katlanmış iki sap — market sepetlerindeki gibi yatık duruyor */}
      <g fill="#3a2c23">
        <rect x="9.5" y="11.4" width="16.5" height="3.6" rx="1.8" transform="rotate(-7 17.75 13.2)" />
        <rect x="22" y="11.4" width="16.5" height="3.6" rx="1.8" transform="rotate(7 30.25 13.2)" />
      </g>
      <g fill="#fff" opacity="0.18">
        <rect x="10.6" y="12" width="14" height="1.2" rx="0.6" transform="rotate(-7 17.6 12.6)" />
        <rect x="23.4" y="12" width="14" height="1.2" rx="0.6" transform="rotate(7 30.4 12.6)" />
      </g>

      {/* Gövde — aşağı doğru daralan plastik kasa */}
      <path
        d="M7.4 17.4h33.2l-3.1 18.5a4 4 0 0 1-3.94 3.3H14.44a4 4 0 0 1-3.94-3.3L7.4 17.4Z"
        fill="url(#nySepetGovde)"
      />

      {/* Dikey delikler */}
      <g fill="#000" opacity="0.16">
        <rect x="13.2" y="23" width="2.5" height="11" rx="1.25" />
        <rect x="19.1" y="23" width="2.5" height="12" rx="1.25" />
        <rect x="25" y="23" width="2.5" height="12.4" rx="1.25" />
        <rect x="30.9" y="23" width="2.5" height="12" rx="1.25" />
        <rect x="36.5" y="23" width="2.5" height="11" rx="1.25" />
      </g>
      <path d="M11.4 34.6h25.2l-.34 2H11.74l-.34-2Z" fill="#000" opacity="0.1" />

      {/* Ağız — açık ve içi karanlık */}
      <ellipse cx="24" cy="17.4" rx="17.4" ry="4.7" fill="url(#nySepetAgiz)" />
      <ellipse cx="24" cy="17.7" rx="14.1" ry="3.2" fill="#71200f" />
      <path
        d="M10.4 15.6a17.4 4.7 0 0 1 27.2 0"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
