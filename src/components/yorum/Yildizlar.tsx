"use client";

import { YildizIkon } from "@/components/ui/Ikonlar";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";

/**
 * Proje dosyasındaki üç değerlendirme ekseni.
 *
 * `etiket` artık metin değil SÖZLÜK ANAHTARI: eksen adları hem Türkçe hem
 * İngilizce gösteriliyor ve çeviri tek yerden geliyor.
 */
export const EKSENLER = [
  { alan: "sicaklik", etiket: "yorum.sicaklik" },
  { alan: "teslimatHizi", etiket: "yorum.teslimatHizi" },
  { alan: "tad", etiket: "yorum.tad" },
] as const;

export type EksenAlani = (typeof EKSENLER)[number]["alan"];

/** Salt okunur yıldız göstergesi. Yarım puanlar dolu yıldıza yuvarlanmaz, soluk gösterilir. */
export function YildizGosterge({
  puan,
  boyut = "sm",
  className,
}: {
  puan: number;
  boyut?: "sm" | "md";
  className?: string;
}) {
  const { dil, c } = useDil();
  const kutu = boyut === "md" ? "size-4.5" : "size-3.5";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={c("yorum.yildizEtiketi", {
        puan: puan.toLocaleString(dil === "en" ? "en-US" : "tr-TR", { minimumFractionDigits: 1 }),
      })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <YildizIkon
          key={i}
          className={cn(
            kutu,
            i <= Math.round(puan) ? "text-sari-500" : "text-kahve-900/15",
          )}
        />
      ))}
    </span>
  );
}

/** Üç eksenin dökümü — restoran ve şef profillerinde kullanılır. */
export function EksenDokumu({
  ozet,
  className,
}: {
  ozet: { sicaklik: number; teslimatHizi: number; tad: number };
  className?: string;
}) {
  const { dil, c } = useDil();

  return (
    <dl className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {EKSENLER.map((e) => (
        <div key={e.alan} className="rounded-2xl bg-kahve-900/4 px-3.5 py-2.5">
          <dt className="text-2xs font-bold tracking-wide text-kahve-500 uppercase">
            {c(e.etiket)}
          </dt>
          <dd className="mt-1 flex items-center gap-2">
            <YildizGosterge puan={ozet[e.alan]} />
            <span className="font-display text-sm font-extrabold text-kahve-900">
              {ozet[e.alan].toLocaleString(dil === "en" ? "en-US" : "tr-TR", {
                minimumFractionDigits: 1,
              })}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
