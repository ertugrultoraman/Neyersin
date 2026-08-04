"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { VARSAYILAN_DIL, type Dil } from "@/lib/dil";
import { ceviri, sec, type Ceviri } from "@/lib/sozluk";

type DilBaglamiTipi = {
  dil: Dil;
  /** Sözlükten metin getirir: `c("sepet.ekle")`. */
  c: Ceviri;
  /** İki dilli içerik alanı seçer: `s(urun.ad, urun.adEn)`. */
  s: (turkce: string, ingilizce?: string | null) => string;
};

const DilBaglami = createContext<DilBaglamiTipi | null>(null);

/**
 * Dil bağlamı.
 *
 * Dil SUNUCUDA çerezden okunup buraya veriliyor; istemci bileşenleri çerezi
 * kendisi okumuyor. Böylece sunucuda basılan HTML ile tarayıcının gösterdiği
 * dil hiçbir zaman ayrışmıyor (yoksa ilk çizimde Türkçe, hemen ardından
 * İngilizce görünüp göz tırmalayan bir sıçrama oluyordu).
 */
export function DilSaglayici({ dil, children }: { dil: Dil; children: ReactNode }) {
  const deger = useMemo<DilBaglamiTipi>(() => {
    const c = ceviri(dil);
    return { dil, c, s: (tr, en) => sec(dil, tr, en) };
  }, [dil]);

  return <DilBaglami.Provider value={deger}>{children}</DilBaglami.Provider>;
}

/**
 * İstemci bileşenlerinde dil ve çeviri.
 *
 * Sağlayıcı dışında da çalışıyor (Türkçeye düşerek): tek bir bileşen
 * sağlayıcının dışında kaldı diye bütün sayfa çökmesin.
 */
export function useDil(): DilBaglamiTipi {
  const baglam = useContext(DilBaglami);
  if (baglam) return baglam;
  const c = ceviri(VARSAYILAN_DIL);
  return { dil: VARSAYILAN_DIL, c, s: (tr, en) => sec(VARSAYILAN_DIL, tr, en) };
}
