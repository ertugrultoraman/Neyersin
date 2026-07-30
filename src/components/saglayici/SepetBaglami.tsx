"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Urun } from "@/content/menuler";
import { restoranBul } from "@/content/restoranlar";
import { tutarlariHesapla, type SiparisKalemi, type Tutarlar } from "@/lib/siparis";

const DEPO_ANAHTARI = "ny-sepet-v1";

type SepetDurumu = {
  restoranSlug: string | null;
  kalemler: SiparisKalemi[];
};

const BOS: SepetDurumu = { restoranSlug: null, kalemler: [] };

type EklemeSonucu = { durum: "eklendi" } | { durum: "farkli-restoran"; mevcutRestoran: string };

type SepetBaglamiTipi = {
  restoranSlug: string | null;
  restoranAdi: string | null;
  kalemler: SiparisKalemi[];
  adetToplam: number;
  tutarlar: Tutarlar | null;
  hazir: boolean;
  cekmeceAcik: boolean;
  setCekmeceAcik: (acik: boolean) => void;
  /** Farklı restorandan ürün eklenmek istenirse sepeti değiştirmez, sinyal döner. */
  ekle: (restoranSlug: string, urun: Urun, adet?: number) => EklemeSonucu;
  /** Onay sonrası: sepeti sıfırlayıp yeni restorandan ekler. */
  sifirlaVeEkle: (restoranSlug: string, urun: Urun, adet?: number) => void;
  adetAyarla: (urunId: string, adet: number) => void;
  kaldir: (urunId: string) => void;
  temizle: () => void;
  urunAdedi: (urunId: string) => number;
};

const SepetBaglami = createContext<SepetBaglamiTipi | null>(null);

export function SepetSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<SepetDurumu>(BOS);
  const [hazir, setHazir] = useState(false);
  const [cekmeceAcik, setCekmeceAcik] = useState(false);

  // localStorage'dan geri yükle (yalnızca ilk render sonrası — SSR uyumu için)
  useEffect(() => {
    try {
      const kayit = window.localStorage.getItem(DEPO_ANAHTARI);
      if (kayit) {
        const cozulen = JSON.parse(kayit) as SepetDurumu;
        if (
          cozulen &&
          Array.isArray(cozulen.kalemler) &&
          (cozulen.restoranSlug === null || restoranBul(cozulen.restoranSlug))
        ) {
          setDurum(cozulen);
        }
      }
    } catch {
      // bozuk kayıt — sessizce boş sepetle devam
    }
    setHazir(true);
  }, []);

  useEffect(() => {
    if (!hazir) return;
    try {
      window.localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(durum));
    } catch {
      // kota dolu veya gizli mod — sepet oturum içinde çalışmaya devam eder
    }
  }, [durum, hazir]);

  const kalemEkle = useCallback((mevcut: SiparisKalemi[], urun: Urun, adet: number) => {
    const varOlan = mevcut.find((k) => k.urunId === urun.id);
    if (varOlan) {
      return mevcut.map((k) =>
        k.urunId === urun.id ? { ...k, adet: Math.min(99, k.adet + adet) } : k,
      );
    }
    return [...mevcut, { urunId: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet }];
  }, []);

  const ekle = useCallback<SepetBaglamiTipi["ekle"]>(
    (restoranSlug, urun, adet = 1) => {
      if (durum.restoranSlug && durum.restoranSlug !== restoranSlug && durum.kalemler.length > 0) {
        return {
          durum: "farkli-restoran",
          mevcutRestoran: restoranBul(durum.restoranSlug)?.ad ?? durum.restoranSlug,
        };
      }
      setDurum((o) => ({
        restoranSlug,
        kalemler: kalemEkle(o.restoranSlug === restoranSlug ? o.kalemler : [], urun, adet),
      }));
      return { durum: "eklendi" };
    },
    [durum.restoranSlug, durum.kalemler.length, kalemEkle],
  );

  const sifirlaVeEkle = useCallback<SepetBaglamiTipi["sifirlaVeEkle"]>(
    (restoranSlug, urun, adet = 1) => {
      setDurum({ restoranSlug, kalemler: kalemEkle([], urun, adet) });
    },
    [kalemEkle],
  );

  const adetAyarla = useCallback<SepetBaglamiTipi["adetAyarla"]>((urunId, adet) => {
    setDurum((o) => {
      if (adet <= 0) {
        const kalanlar = o.kalemler.filter((k) => k.urunId !== urunId);
        return { restoranSlug: kalanlar.length > 0 ? o.restoranSlug : null, kalemler: kalanlar };
      }
      return {
        ...o,
        kalemler: o.kalemler.map((k) =>
          k.urunId === urunId ? { ...k, adet: Math.min(99, adet) } : k,
        ),
      };
    });
  }, []);

  const kaldir = useCallback<SepetBaglamiTipi["kaldir"]>(
    (urunId) => adetAyarla(urunId, 0),
    [adetAyarla],
  );

  const temizle = useCallback(() => setDurum(BOS), []);

  const deger = useMemo<SepetBaglamiTipi>(() => {
    const adetToplam = durum.kalemler.reduce((t, k) => t + k.adet, 0);
    return {
      restoranSlug: durum.restoranSlug,
      restoranAdi: durum.restoranSlug ? (restoranBul(durum.restoranSlug)?.ad ?? null) : null,
      kalemler: durum.kalemler,
      adetToplam,
      tutarlar: durum.restoranSlug
        ? tutarlariHesapla(durum.kalemler, durum.restoranSlug)
        : null,
      hazir,
      cekmeceAcik,
      setCekmeceAcik,
      ekle,
      sifirlaVeEkle,
      adetAyarla,
      kaldir,
      temizle,
      urunAdedi: (urunId: string) => durum.kalemler.find((k) => k.urunId === urunId)?.adet ?? 0,
    };
  }, [durum, hazir, cekmeceAcik, ekle, sifirlaVeEkle, adetAyarla, kaldir, temizle]);

  return <SepetBaglami.Provider value={deger}>{children}</SepetBaglami.Provider>;
}

export function useSepet(): SepetBaglamiTipi {
  const baglam = useContext(SepetBaglami);
  if (!baglam) throw new Error("useSepet, SepetSaglayici içinde kullanılmalı.");
  return baglam;
}
