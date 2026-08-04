import { AkilliGorsel } from "../ui/AkilliGorsel";
import { KontrolIkon } from "../ui/Ikonlar";
import { Reveal } from "../ui/Reveal";
import { UstBaslik } from "../ui/Rozet";
import { tohum } from "@/lib/utils";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

const FAYDALAR = [
  "mobil.madde1",
  "mobil.madde2",
  "mobil.madde3",
  "mobil.madde4",
];

/**
 * Dekoratif QR deseni.
 *
 * ÖNEMLİ: Bu tarama yapılabilir gerçek bir QR kod DEĞİL, marka desenli bir
 * yer tutucudur — mağaza bağlantıları henüz yayında olmadığı için kodlanacak
 * geçerli bir adres de yok. Uygulama yayına alındığında `qrcode` benzeri bir
 * paketle gerçek kod üretilip buranın yerine konmalı (bkz. README).
 */
function QrDeseni() {
  const hucreler: boolean[] = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    // Köşe hizalama kareleri
    const koseMi = (kx: number, ky: number) =>
      x >= kx && x <= kx + 6 && y >= ky && y <= ky + 6;
    if (koseMi(0, 0) || koseMi(14, 0) || koseMi(0, 14)) {
      const lx = x % 14;
      const ly = y % 14;
      const dx = Math.min(lx, 6 - lx);
      const dy = Math.min(ly, 6 - ly);
      const d = Math.min(dx, dy);
      return d === 0 || d === 2;
    }
    return tohum(`qr-${x}-${y}`) % 100 < 46;
  });

  return (
    <svg viewBox="0 0 21 21" className="size-full" aria-hidden="true" shapeRendering="crispEdges">
      <rect width="21" height="21" fill="#FFF9EF" />
      {hucreler.map((dolu, i) =>
        dolu ? (
          <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#241608" />
        ) : null,
      )}
    </svg>
  );
}

function MagazaRozeti({
  ustMetin,
  altMetin,
  children,
}: {
  ustMetin: string;
  altMetin: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="#mobil-uygulama"
      className="group/mag flex items-center gap-3 rounded-2xl border border-white/15
        bg-white/8 px-4 py-3 transition-all duration-300 ease-[var(--ease-yumusak)]
        hover:-translate-y-0.5 hover:border-sari-500/60 hover:bg-white/14"
    >
      <span className="text-sari-400 transition-transform duration-500 group-hover/mag:scale-110">
        {children}
      </span>
      <span className="leading-tight">
        <span className="block text-2xs font-medium tracking-wide text-kahve-200/70 uppercase">
          {ustMetin}
        </span>
        <span className="block font-display text-base font-extrabold text-white">{altMetin}</span>
      </span>
    </a>
  );
}

export async function MobilUygulama() {
  const c = ceviri(await aktifDil());

  return (
    <section id="mobil-uygulama" className="scroll-mt-28 py-14 md:py-20">
      <div className="kap">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-kahve-900 px-6 py-12 md:px-12 md:py-16">
          {/* Zemin dekoru */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 size-80 rounded-full bg-sari-500/14 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #FFF9EF 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <Reveal>
                <UstBaslik className="text-sari-400">Mobil uygulama</UstBaslik>
              </Reveal>

              <Reveal gecikme={0.06}>
                <h2 className="mt-4 text-3xl leading-tight font-extrabold text-white sm:text-4xl md:text-[2.75rem]">
                  Ne Yersin? <span className="metin-sari">cebinde</span>
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-kahve-200/85">
                  {c("mobil.aciklama1")} {c("mobil.aciklama2")}
                </p>
              </Reveal>

              <Reveal gecikme={0.12}>
                <ul className="mt-7 space-y-3">
                  {FAYDALAR.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-kahve-100/90">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sari-500/20 text-sari-400">
                        <KontrolIkon className="size-3.5" strokeWidth="2.6" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal gecikme={0.18}>
                <div className="mt-9 flex flex-wrap items-stretch gap-4">
                  {/* QR kart */}
                  <div className="flex items-center gap-4 rounded-2xl bg-white/95 p-3 pr-5 shadow-kalkik">
                    <div className="size-20 overflow-hidden rounded-xl ring-1 ring-kahve-900/10">
                      <QrDeseni />
                    </div>
                    <p className="max-w-[9rem] text-xs leading-snug font-semibold text-kahve-700">
                      {c("mobil.karekod")}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <MagazaRozeti ustMetin={c("mobil.indir")} altMetin="App Store">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
                        <path d="M16.2 12.6c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2 1 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.6s1.8-1 2.5-2c.5-.7.7-1.1 1-1.9-2.5-.9-2.4-3.3-2.4-3.4Zm-2-6.3c.5-.7.9-1.6.8-2.5-.8 0-1.8.5-2.4 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.9-.4 2.4-1.1Z" />
                      </svg>
                    </MagazaRozeti>
                    <MagazaRozeti ustMetin={c("mobil.indir")} altMetin="Google Play">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden="true">
                        <path d="M4 3.3v17.4c0 .5.5.8.9.6l9.6-5.5-3.2-3.2L4 3.3Zm11.9 6.4L13 12l2.9 2.3 3.7-2.1c.5-.3.5-1 0-1.3l-3.7-2.2ZM4.9 2.4 14 11.3l-9.1 8.9c-.1-.1-.1-.3-.1-.5V2.9c0-.2 0-.4.1-.5Z" />
                      </svg>
                    </MagazaRozeti>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal gecikme={0.1} kaydir={32} className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 -rotate-3 rounded-[2.5rem] bg-sari-500/12"
              />
              <AkilliGorsel
                anahtar="home/mobil-uygulama"
                oran="4/3"
                sizes="(min-width: 1024px) 32rem, 88vw"
                className="rounded-[1.75rem] shadow-kalkik ring-1 ring-white/10"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
