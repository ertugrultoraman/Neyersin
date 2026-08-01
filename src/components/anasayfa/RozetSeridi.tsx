"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { restoranlar, type Restoran } from "@/content/restoranlar";
import { cn } from "@/lib/utils";
import { Bolum, BolumBasligi } from "../ui/Bolum";
import { RozetIkon } from "../ui/Ikonlar";

type RozetTanimi = {
  slug: string;
  baslik: string;
  aciklama: string;
  restoran: Restoran;
  ton: "sari" | "kahve" | "domates" | "nane";
};

/**
 * Rozetler yalnızca DOĞRULANABİLİR özelliklerden hesaplanır.
 *
 * Eskiden "Ayın En Çok Satanı — 5.127 yorum" gibi kartlar vardı; platformun
 * tek bir tamamlanmış siparişi yokken bu uydurmaydı. Yorum ve puan gerçekten
 * birikmeye başlayana kadar rozetler hazırlık süresi, mutfak türü ve alt limit
 * gibi bugün DOĞRU olan alanlara dayanıyor.
 */
function rozetleriHesapla(): RozetTanimi[] {
  if (restoranlar.length === 0) return [];

  const rozetler: RozetTanimi[] = [];

  // Süre artık tüm mutfaklarda aynı, "en hızlı" diye bir ayrım yok.
  // Yerine kampanyası olan bir mutfak öne çıkarılıyor — bu doğrulanabilir.
  const kampanyali = restoranlar.find((r) => r.kampanya);
  if (kampanyali) {
    rozetler.push({
      slug: "kampanyali",
      baslik: "Bugünün Kampanyası",
      aciklama: `${kampanyali.ad} — ${kampanyali.kampanya}`,
      restoran: kampanyali,
      ton: "nane",
    });
  }

  const evMutfagi = restoranlar.find((r) => r.sefTuru === "ev-hanimi") ??
    restoranlar.find((r) => r.evSefi);
  if (evMutfagi) {
    rozetler.push({
      slug: "ev-mutfagindan",
      baslik: "Ev Mutfağından",
      aciklama: `${evMutfagi.ad} — kendi mutfağından pişiriyor`,
      restoran: evMutfagi,
      ton: "sari",
    });
  }

  // Alt limit de her yerde aynı; "en düşük" demek yerine öne çıkan mutfak.
  const oneCikan = restoranlar.find((r) => r.oneCikan && r.slug !== kampanyali?.slug);
  if (oneCikan) {
    rozetler.push({
      slug: "one-cikan",
      baslik: "Öne Çıkan Mutfak",
      aciklama: `${oneCikan.ad} — ${oneCikan.mutfaklar.slice(0, 2).join(", ")}`,
      restoran: oneCikan,
      ton: "domates",
    });
  }

  const yeni = restoranlar.find((r) => r.etiketler.includes("Yeni"));
  if (yeni) {
    rozetler.push({
      slug: "yeni-katilan",
      baslik: "Yeni Katılan",
      aciklama: `${yeni.ad} — platforma yeni katıldı`,
      restoran: yeni,
      ton: "kahve",
    });
  }

  return rozetler;
}

const TONLAR: Record<RozetTanimi["ton"], string> = {
  sari: "bg-gradient-to-br from-sari-300 to-sari-500 text-kahve-900",
  kahve: "bg-gradient-to-br from-kahve-700 to-kahve-900 text-sari-100",
  domates: "bg-gradient-to-br from-domates to-domates-koyu text-white",
  nane: "bg-gradient-to-br from-nane to-nane-koyu text-white",
};

/** 7 saniyede bir kendiliğinden sağa kayan, sonda başa dönen rozet şeridi. */
export function RozetSeridi() {
  const rozetler = rozetleriHesapla();
  const seritRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (rozetler.length === 0) return;
    const zamanlayici = window.setInterval(() => {
      const serit = seritRef.current;
      if (!serit) return;
      const kartGenisligi = serit.firstElementChild?.clientWidth ?? 0;
      const bosluk = 16; // gap-4
      const sonaYakin = serit.scrollLeft + serit.clientWidth >= serit.scrollWidth - 8;
      serit.scrollTo({
        left: sonaYakin ? 0 : serit.scrollLeft + kartGenisligi + bosluk,
        behavior: "smooth",
      });
    }, 7000);
    return () => window.clearInterval(zamanlayici);
  }, [rozetler.length]);

  if (rozetler.length === 0) return null;

  return (
    <Bolum id="rozetler">
      <BolumBasligi
        ustBaslik="Öne çıkanlar"
        baslik="Mutfaklardan notlar"
        aciklama="Mutfak türü, kampanya ve etiket gibi doğrulanabilir bilgilerden hesaplanır."
      />

      <ul
        ref={seritRef}
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 gizli-scroll"
      >
        {rozetler.map((r) => (
          <li key={r.slug} className="w-64 shrink-0 snap-start sm:w-72">
            <Link
              href={`/restoran/${r.restoran.slug}`}
              className={cn(
                "tiklanabilir group relative flex h-full flex-col overflow-hidden rounded-4xl p-6 kart-kalk",
                TONLAR[r.ton],
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-14 -right-10 size-40 rounded-full
                  border-[14px] border-white/10 transition-transform duration-700
                  ease-[var(--ease-yumusak)] group-hover:scale-110"
              />
              <span className="relative grid size-11 place-items-center rounded-2xl bg-white/18">
                <RozetIkon className="size-5.5" />
              </span>
              <h3
                className={cn(
                  "relative mt-5 font-display text-lg font-extrabold",
                  r.ton === "sari" ? "text-kahve-900" : "text-inherit",
                )}
              >
                {r.baslik}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed opacity-90">{r.aciklama}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Bolum>
  );
}
