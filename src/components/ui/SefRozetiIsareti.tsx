"use client";

import Image from "next/image";

import { BASAMAKLAR, type SefRozeti } from "@/lib/sef-rozetleri";
import { cn } from "@/lib/utils";
import { useDil } from "../saglayici/DilBaglami";

/**
 * Şef rozetinin küçük hâli — kartta, profil başlığında, panelde aynı işaret.
 *
 * İSTEMCİ bileşeni olması bilinçli: restoran kartı zaten `"use client"` ve
 * `useDil()` kullanıyor. Rozeti sunucu bileşeni yapsaydık kart için ayrı bir
 * kopya yazmak ya da çevrilmiş metni prop olarak elden ele taşımak gerekirdi.
 * Rozet VERİSİ yine sunucudan geliyor — bu bileşen yalnızca onu çiziyor.
 */
export function SefRozetiIsareti({
  rozet,
  boyut = "kucuk",
  className,
}: {
  rozet: SefRozeti;
  /** `kucuk` kart köşesi için, `orta` profil başlığı için. */
  boyut?: "kucuk" | "orta";
  className?: string;
}) {
  const { c } = useDil();
  const tanim = BASAMAKLAR[rozet.basamak];
  const orta = boyut === "orta";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/94 font-bold text-kahve-900 shadow-yumusak backdrop-blur-sm",
        orta ? "px-3 py-1.5 text-xs" : "px-2 py-1 text-2xs",
        className,
      )}
    >
      <Image
        src={tanim.gorsel}
        alt=""
        width={384}
        height={330}
        aria-hidden="true"
        className={cn("shrink-0 object-contain", orta ? "size-6" : "size-4.5")}
      />
      <span className="whitespace-nowrap">{c(tanim.adAnahtari)}</span>
      {orta && (
        <span className="font-semibold text-kahve-500">
          · {c("sefRozeti.siparis", { sayi: rozet.adet })}
        </span>
      )}
    </span>
  );
}
