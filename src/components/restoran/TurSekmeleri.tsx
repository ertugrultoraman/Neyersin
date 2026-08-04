import Link from "next/link";

import { cn } from "@/lib/utils";
import { DukkanIkon, KullaniciIkon, MutfakIkon } from "../ui/Ikonlar";
import { aktifDil } from "@/lib/dil-sunucu";
import { ceviri } from "@/lib/sozluk";

export type Tur = "hepsi" | "sef" | "isletme";

/**
 * Şefler ve işletmeler arasında geçiş sekmeleri.
 *
 * Girişteki seçim ekranı tek yönlüydü: bir kez seçtikten sonra diğerine
 * geçmek için anasayfaya dönüp yeniden seçmek gerekiyordu. Bu sekmeler
 * listenin en üstünde hep duruyor, iki taraf da tek tıkla açılıyor.
 *
 * Sekmeler gerçek bağlantı (adres değişiyor) — bu sayede paylaşılabilir,
 * yer imine eklenebilir ve geri tuşu beklendiği gibi çalışır.
 */
const SEKMELER: { tur: Tur; etiket: string; href: string; Ikon: typeof MutfakIkon }[] = [
  { tur: "sef", etiket: "liste.sekmeSef", href: "/seflerin-elinden", Ikon: KullaniciIkon },
  { tur: "isletme", etiket: "liste.sekmeIsletme", href: "/isletmeler", Ikon: DukkanIkon },
  { tur: "hepsi", etiket: "Hepsi", href: "/restoranlar", Ikon: MutfakIkon },
];

export async function TurSekmeleri({
  aktif,
  sayilar,
}: {
  aktif: Tur;
  sayilar: Record<Tur, number>;
}) {
  const c = ceviri(await aktifDil());
  return (
    <div className="kap">
      <nav
        aria-label="Mutfak türü"
        className="flex gap-2 overflow-x-auto rounded-3xl border border-kahve-900/8
          bg-white/70 p-2 backdrop-blur gizli-scroll sm:gap-3"
      >
        {SEKMELER.map((s) => {
          const secili = s.tur === aktif;
          return (
            <Link
              key={s.tur}
              href={s.href}
              aria-current={secili ? "page" : undefined}
              className={cn(
                "group flex flex-1 shrink-0 items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5",
                "text-sm font-bold whitespace-nowrap transition-all duration-300 ease-[var(--ease-yumusak)]",
                secili
                  ? "bg-gradient-to-br from-sari-300 to-sari-500 text-kahve-900 shadow-sari"
                  : "text-kahve-600 hover:bg-kahve-900/5 hover:text-kahve-900",
              )}
            >
              <s.Ikon
                className={cn(
                  "size-4.5 shrink-0 transition-transform duration-500 ease-[var(--ease-yayli)]",
                  "group-hover:scale-110",
                )}
              />
              {c(s.etiket)}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-display text-2xs font-extrabold",
                  secili ? "bg-kahve-900/12 text-kahve-900" : "bg-kahve-900/6 text-kahve-500",
                )}
              >
                {sayilar[s.tur]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
