"use client";

import { useTransition } from "react";

import { dilSecAction } from "@/app/dil-actions";
import { DILLER, DIL_ETIKETLERI, type Dil } from "@/lib/dil";
import { useDil } from "../saglayici/DilBaglami";

/**
 * TR / EN düğmesi.
 *
 * İki dil olduğu için açılır liste yerine iki küçük düğme: tek dokunuşla
 * geçiliyor, menüyü açıp kapatmaya gerek kalmıyor.
 *
 * Seçim SUNUCUDA çereze yazılıp sayfa yeniden basılıyor. Yalnızca tarayıcıda
 * değiştirmek yetmezdi: sunucu bileşenlerinden gelen metinler (menü,
 * ürün açıklamaları, e-posta) Türkçe kalırdı.
 */
export function DilDegistirici({ ince = false }: { ince?: boolean }) {
  const { dil, c } = useDil();
  const [bekliyor, gecir] = useTransition();

  function sec(yeni: Dil) {
    if (yeni === dil || bekliyor) return;
    const veri = new FormData();
    veri.set("dil", yeni);
    gecir(() => {
      void dilSecAction(veri);
    });
  }

  return (
    <div
      role="group"
      aria-label={c("dil.degistir")}
      className={`inline-flex items-center rounded-full border border-kahve-900/12 p-0.5
        ${bekliyor ? "opacity-60" : ""} ${ince ? "scale-95" : ""}`}
    >
      {DILLER.map((d) => {
        const secili = d === dil;
        return (
          <button
            key={d}
            type="button"
            onClick={() => sec(d)}
            aria-pressed={secili}
            /* Ekran okuyucu "TR" yerine dilin adını okusun. */
            aria-label={d === "tr" ? c("dil.turkce") : c("dil.ingilizce")}
            className={`tiklanabilir rounded-full px-2.5 py-1 text-2xs font-extrabold
              tracking-wide transition-colors duration-300 ${
                secili
                  ? "bg-kahve-900 text-krem"
                  : "text-kahve-500 hover:bg-kahve-900/6 hover:text-kahve-900"
              }`}
          >
            {DIL_ETIKETLERI[d]}
          </button>
        );
      })}
    </div>
  );
}
