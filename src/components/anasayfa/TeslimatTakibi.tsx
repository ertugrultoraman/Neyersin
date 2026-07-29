"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Bolum } from "../ui/Bolum";
import { KonumIkon, KontrolIkon, MutfakIkon, ScooterIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";
import { Rozet } from "../ui/Rozet";

const ADIMLAR = [
  { Ikon: KontrolIkon, baslik: "Sipariş alındı", saat: "19:02", not: "Restoran siparişi onayladı" },
  { Ikon: MutfakIkon, baslik: "Mutfakta hazırlanıyor", saat: "19:05", not: "Tahmini bitiş 19:16" },
  { Ikon: ScooterIkon, baslik: "Kurye yolda", saat: "19:17", not: "Mehmet A. • 2,1 km uzakta" },
  { Ikon: KonumIkon, baslik: "Teslim edildi", saat: "19:24", not: "Kapıda teslim alındı" },
];

/** Rota köşe noktaları — hem çizim hem kurye işaretçisi bu diziden besleniyor. */
const NOKTALAR: [number, number][] = [
  [48, 236],
  [48, 172],
  [132, 172],
  [132, 108],
  [240, 108],
  [240, 64],
  [344, 64],
];

const ROTA = NOKTALAR.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

/** Segment uzunluklarına göre orantılı zaman damgaları — hız sabit görünsün. */
const ZAMANLAR = (() => {
  const uzunluklar = NOKTALAR.slice(1).map(([x, y], i) => {
    const [px, py] = NOKTALAR[i];
    return Math.hypot(x - px, y - py);
  });
  const toplam = uzunluklar.reduce((a, b) => a + b, 0);
  let birikim = 0;
  return [0, ...uzunluklar.map((u) => (birikim += u) / toplam)];
})();

const DONGU_SN = 7.2;

export function TeslimatTakibi() {
  const ref = useRef<HTMLDivElement>(null);
  const gorunur = useInView(ref, { margin: "-120px" });
  const azalt = useReducedMotion();
  const [adim, setAdim] = useState(azalt ? ADIMLAR.length - 1 : 0);

  /**
   * Rota çizimi, kurye işaretçisi ve zaman çizelgesi TEK bir ilerleme değerinden
   * beslenir. Ayrı animasyonlar kullanıldığında işaretçi çizilen çizgiden ileri
   * kaçıyordu; tek saat bunu yapısal olarak imkânsız kılıyor.
   */
  const ilerleme = useMotionValue(azalt ? 1 : 0);
  const isaretciX = useTransform(ilerleme, ZAMANLAR, NOKTALAR.map(([x]) => x));
  const isaretciY = useTransform(ilerleme, ZAMANLAR, NOKTALAR.map(([, y]) => y));

  useEffect(() => {
    if (azalt) {
      ilerleme.set(1);
      setAdim(ADIMLAR.length - 1);
      return;
    }
    if (!gorunur) return;
    const kontrol = animate(ilerleme, 1, {
      duration: DONGU_SN,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });
    return () => kontrol.stop();
  }, [gorunur, azalt, ilerleme]);

  // Zaman çizelgesi adımı da aynı ilerlemeden türer
  useMotionValueEvent(ilerleme, "change", (v) => {
    const sonraki = Math.min(ADIMLAR.length - 1, Math.floor(v * ADIMLAR.length));
    setAdim((o) => (o === sonraki ? o : sonraki));
  });

  return (
    <Bolum id="teslimat-takibi" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-32 size-80 rounded-full bg-sari-300/25 blur-3xl"
      />

      <div ref={ref} className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Sol: zaman çizelgesi */}
        <div>
          <Reveal>
            <Rozet ton="nane">
              <span className="relative grid size-2 place-items-center">
                <span className="absolute size-2 rounded-full bg-nane animate-nabiz" />
                <span className="size-1 rounded-full bg-nane-koyu" />
              </span>
              Canlı
            </Rozet>
          </Reveal>

          <Reveal gecikme={0.06}>
            <h2 className="mt-5 text-3xl leading-tight font-extrabold sm:text-4xl md:text-[2.75rem]">
              Siparişin nerede? <span className="metin-sari">Saniye saniye</span> gör.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-kahve-600">
              Teslimat takibi bir tahmin ekranı değil. Mutfaktaki gerçek durum, kuryenin
              konumu ve söz verilen saat aynı kayıttan beslenir — üçü birbirini tutar.
            </p>
          </Reveal>

          <ol className="mt-9 space-y-1">
            {ADIMLAR.map((a, i) => {
              const tamam = i <= adim;
              const suanki = i === adim;

              return (
                <li key={a.baslik} className="relative flex gap-4 pb-5 last:pb-0">
                  {/* Bağlayıcı çizgi */}
                  {i < ADIMLAR.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-11 left-[1.375rem] h-full w-0.5 -translate-x-1/2 rounded-full bg-kahve-900/8"
                    >
                      <motion.span
                        className="block w-full rounded-full bg-nane"
                        initial={{ height: 0 }}
                        animate={{ height: i < adim ? "100%" : 0 }}
                        transition={{ duration: azalt ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                  )}

                  <motion.span
                    className={`relative z-10 grid size-11 shrink-0 place-items-center rounded-2xl
                      transition-colors duration-500
                      ${tamam ? "bg-nane text-white" : "bg-kahve-900/6 text-kahve-400"}`}
                    animate={
                      suanki && !azalt
                        ? { scale: [1, 1.08, 1], boxShadow: "0 8px 22px -8px rgb(18 166 122 / 0.6)" }
                        : { scale: 1, boxShadow: "none" }
                    }
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <a.Ikon className="size-5" />
                  </motion.span>

                  <div className="pt-1">
                    <p className="flex flex-wrap items-baseline gap-x-2.5">
                      <span
                        className={`font-display text-base font-extrabold transition-colors duration-500
                          ${tamam ? "text-kahve-900" : "text-kahve-400"}`}
                      >
                        {a.baslik}
                      </span>
                      <span className="font-mono text-xs font-semibold text-kahve-400">
                        {a.saat}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-kahve-500">{a.not}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Sağ: harita ve rota */}
        <Reveal gecikme={0.1} kaydir={30}>
          <div
            className="relative overflow-hidden rounded-[2rem] border border-kahve-900/8
              bg-white shadow-kalkik"
          >
            <svg viewBox="0 0 400 300" className="w-full" role="img" aria-label="Teslimat rotası haritası">
              <defs>
                <linearGradient id="harita-zemin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFFDF0" />
                  <stop offset="100%" stopColor="#FDF1DD" />
                </linearGradient>
              </defs>

              <rect width="400" height="300" fill="url(#harita-zemin)" />

              {/* Sokak ızgarası */}
              <g stroke="#241608" strokeOpacity="0.07" strokeWidth="1.5">
                {[40, 88, 136, 184, 232, 280].map((y) => (
                  <path key={`y${y}`} d={`M0 ${y}h400`} />
                ))}
                {[56, 124, 192, 260, 328].map((x) => (
                  <path key={`x${x}`} d={`M${x} 0v300`} />
                ))}
              </g>

              {/* Yapı adaları */}
              <g fill="#241608" fillOpacity="0.05">
                <rect x="64" y="48" width="52" height="32" rx="6" />
                <rect x="200" y="128" width="48" height="44" rx="6" />
                <rect x="272" y="196" width="60" height="36" rx="6" />
                <rect x="72" y="196" width="40" height="28" rx="6" />
              </g>

              {/* Rota — önce soluk tam hat, üzerine çizilen aktif hat */}
              <path d={ROTA} fill="none" stroke="#241608" strokeOpacity="0.1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <motion.path
                d={ROTA}
                fill="none"
                stroke="#FDC806"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: ilerleme }}
              />

              {/* Restoran ve ev işaretleri */}
              <g>
                <circle cx="48" cy="236" r="15" fill="#241608" />
                <circle cx="48" cy="236" r="15" fill="none" stroke="#FDC806" strokeWidth="2.5" />
                <g transform="translate(48 236) scale(0.62) translate(-12 -12)" stroke="#FDC806" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9.5V20h16V9.5" />
                  <path d="M3 9.5 5 4h14l2 5.5Z" />
                </g>
              </g>

              <g>
                <circle cx="344" cy="64" r="15" fill="#12A67A" />
                <g transform="translate(344 64) scale(0.62) translate(-12 -12)" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11 12 4l8 7" />
                  <path d="M6.5 9.5V20h11V9.5" />
                </g>
              </g>

              {/* Kurye işaretçisi — rota köşelerinden geçen kare dalga hareket */}
              <motion.g style={{ x: isaretciX, y: isaretciY }}>
                <circle r="17" fill="#FDC806" fillOpacity="0.32" />
                <circle r="11" fill="#FDC806" stroke="#241608" strokeWidth="2" />
                <g transform="scale(0.5) translate(-12 -12)" stroke="#241608" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5.5" cy="17.5" r="3" />
                  <circle cx="18" cy="17.5" r="3" />
                  <path d="M8.5 17.5h5l2-8h-3" />
                  <path d="M15.5 9.5H19v6" />
                </g>
              </motion.g>
            </svg>

            {/* Harita üstü bilgi şeridi */}
            <div className="flex items-center justify-between gap-4 border-t border-kahve-900/8 px-5 py-4">
              <div>
                <p className="font-display text-lg leading-none font-extrabold text-kahve-900">
                  Tahmini varış 19:24
                </p>
                <p className="mt-1 text-xs font-medium text-kahve-500">
                  Kırmızı Fırın • Beşiktaş → Ihlamurdere Cd.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-2 rounded-full bg-nane/12 px-3 py-1.5 text-xs font-bold text-nane-koyu">
                <span className="relative grid size-2 place-items-center">
                  <span className="absolute size-2 rounded-full bg-nane animate-nabiz" />
                  <span className="size-1 rounded-full bg-nane-koyu" />
                </span>
                Zamanında
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Bolum>
  );
}
