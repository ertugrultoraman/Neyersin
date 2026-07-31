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
 * Rozetler gerçek veriden hesaplanır (yorum/puan/süre) — uydurma istatistik yok.
 * Değerlendirmesi olmayan (yorum: 0) restoranlar "en çok satan/beğenilen"
 * yarışına girmez, aksi hâlde sıfır yorumla haksız avantaj kazanırlar.
 */
function rozetleriHesapla(): RozetTanimi[] {
  const degerlendirilmis = restoranlar.filter((r) => r.yorum > 0);
  if (degerlendirilmis.length === 0) return [];

  const enCokSatan = [...degerlendirilmis].sort((a, b) => b.yorum - a.yorum)[0];
  const enCokBegenilen = [...degerlendirilmis].sort(
    (a, b) => b.puan - a.puan || b.yorum - a.yorum,
  )[0];
  const enHizli = [...degerlendirilmis].sort((a, b) => a.sureDk[0] - b.sureDk[0])[0];
  const yukselenYildiz =
    restoranlar.find((r) => r.etiketler.includes("Yeni") && r.evSefi) ??
    restoranlar.find((r) => r.etiketler.includes("Yeni"));

  const rozetler: RozetTanimi[] = [
    {
      slug: "en-cok-satan",
      baslik: "Ayın En Çok Satanı",
      aciklama: `${enCokSatan.ad} — ${enCokSatan.yorum.toLocaleString("tr-TR")} yorum`,
      restoran: enCokSatan,
      ton: "sari",
    },
    {
      slug: "en-cok-begenilen",
      baslik: "Ayın En Çok Beğenileni",
      aciklama: `${enCokBegenilen.ad} — ${enCokBegenilen.puan.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} puan`,
      restoran: enCokBegenilen,
      ton: "domates",
    },
    {
      slug: "en-hizli-teslimat",
      baslik: "En Hızlı Teslimat",
      aciklama: `${enHizli.ad} — ${enHizli.sureDk[0]} dakikada kapında`,
      restoran: enHizli,
      ton: "nane",
    },
  ];

  if (yukselenYildiz) {
    rozetler.push({
      slug: "yukselen-yildiz",
      baslik: "Yükselen Yıldız",
      aciklama: `${yukselenYildiz.ad} — platforma yeni katıldı`,
      restoran: yukselenYildiz,
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
        ustBaslik="Bu Ay"
        baslik="Ayın rozetleri"
        aciklama="Gerçek yorum ve puanlardan hesaplanır, her ay güncellenir."
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
