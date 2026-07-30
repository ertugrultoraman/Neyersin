"use client";

import { useState } from "react";

import type { Urun } from "@/content/menuler";
import { cn } from "@/lib/utils";
import { useSepet } from "../saglayici/SepetBaglami";
import { Buton } from "../ui/Buton";
import { SepetIkon } from "../ui/Ikonlar";
import { Katman } from "../ui/Katman";

/**
 * Ürün kartındaki sepete ekleme kontrolü.
 * Sepette adet yoksa buton, varsa adet ayarlayıcı gösterir.
 */
export function SepeteEkle({
  restoranSlug,
  urun,
  tamGenislik = false,
}: {
  restoranSlug: string;
  urun: Urun;
  tamGenislik?: boolean;
}) {
  const { ekle, sifirlaVeEkle, adetAyarla, urunAdedi, setCekmeceAcik } = useSepet();
  const [catisma, setCatisma] = useState<string | null>(null);
  const adet = urunAdedi(urun.id);

  function eklemeyiDene() {
    const sonuc = ekle(restoranSlug, urun);
    if (sonuc.durum === "farkli-restoran") {
      setCatisma(sonuc.mevcutRestoran);
    }
  }

  if (adet > 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-sari-500 p-1 shadow-sari",
          tamGenislik && "w-full justify-between",
        )}
      >
        <button
          type="button"
          onClick={() => adetAyarla(urun.id, adet - 1)}
          aria-label={`${urun.ad} adedini azalt`}
          className="grid size-8 place-items-center rounded-full text-kahve-900
            transition-colors duration-300 hover:bg-kahve-900/12"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
            <path d="M5 10h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <span
          aria-live="polite"
          className="min-w-6 text-center font-display text-sm font-extrabold text-kahve-900"
        >
          {adet}
        </span>
        <button
          type="button"
          onClick={() => adetAyarla(urun.id, adet + 1)}
          aria-label={`${urun.ad} adedini artır`}
          className="grid size-8 place-items-center rounded-full text-kahve-900
            transition-colors duration-300 hover:bg-kahve-900/12"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
            <path
              d="M10 5v10M5 10h10"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <Buton
        type="button"
        boyut="sm"
        onClick={eklemeyiDene}
        className={tamGenislik ? "w-full" : undefined}
        ikon={<SepetIkon className="size-4" />}
      >
        Sepete ekle
      </Buton>

      <Katman
        acik={catisma !== null}
        kapat={() => setCatisma(null)}
        konum="orta"
        baslik="Sepetini değiştirelim mi?"
        aciklama="Sepetinde başka bir restorandan ürünler var. Aynı siparişte yalnızca tek restorandan ürün olabilir."
      >
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-kahve-700">
            Sepetinde <strong className="text-kahve-900">{catisma}</strong> siparişi duruyor.
            Devam edersen o sepet silinir ve <strong className="text-kahve-900">{urun.ad}</strong>{" "}
            ile yeni bir sepet başlatılır.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Buton
              type="button"
              boyut="md"
              className="flex-1"
              onClick={() => {
                sifirlaVeEkle(restoranSlug, urun);
                setCatisma(null);
                setCekmeceAcik(true);
              }}
            >
              Sepeti değiştir
            </Buton>
            <Buton
              type="button"
              tur="hayalet"
              boyut="md"
              className="flex-1"
              onClick={() => setCatisma(null)}
            >
              Vazgeç
            </Buton>
          </div>
        </div>
      </Katman>
    </>
  );
}
