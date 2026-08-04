"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";

export type HesapBolumu = {
  href: string;
  etiket: string;
  aciklama: string;
};

/**
 * Hesap ayarlarının sol menüsü.
 *
 * Bölümler ALT ALTA sıralanıyor, her başlık kendi satırında ve kırılmadan
 * yazılıyor (`whitespace-nowrap`): daha önce parola formu profilin ortasında
 * hep açık duruyordu, ayarlar tek yerde toplanmamıştı.
 *
 * Dar ekranda menü yatay kayan bir şeride dönüşüyor; sol sütun 640 px altında
 * ekranın yarısını yiyordu.
 */
export function HesapMenusu({ bolumler }: { bolumler: HesapBolumu[] }) {
  const { c } = useDil();
  const yol = usePathname();

  return (
    <nav aria-label={c("hesabim.hesapMenusu")} className="lg:sticky lg:top-24">
      <ul
        className="flex gap-2 overflow-x-auto pb-2 gizli-scroll
          lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0"
      >
        {bolumler.map((b) => {
          const secili = yol === b.href;
          return (
            <li key={b.href} className="shrink-0 lg:shrink">
              <Link
                href={b.href}
                aria-current={secili ? "page" : undefined}
                className={cn(
                  "block rounded-2xl px-4 py-3 transition-colors duration-300",
                  secili
                    ? "bg-sari-500 text-kahve-900 shadow-sari"
                    : "bg-white text-kahve-700 hover:bg-kahve-900/5 hover:text-kahve-900",
                )}
              >
                <span className="block text-sm font-extrabold whitespace-nowrap">{b.etiket}</span>
                <span
                  className={cn(
                    "mt-0.5 hidden text-xs leading-snug lg:block",
                    secili ? "text-kahve-900/70" : "text-kahve-500",
                  )}
                >
                  {b.aciklama}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
