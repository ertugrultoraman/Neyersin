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

import { kuponUygula as kuponuDogrula } from "@/content/kampanyalar";
import type { Urun } from "@/content/menuler";
import {
  kalemBirimFiyati,
  tutarlariHesapla,
  type SecilenEkstra,
  type SiparisKalemi,
  type Tutarlar,
} from "@/lib/siparis";

/** Aynı ürün farklı ekstra seçimleriyle ayrı sepet satırı olur. */
function satirIdUret(urunId: string, ekstralar?: SecilenEkstra[]): string {
  if (!ekstralar || ekstralar.length === 0) return urunId;
  const anahtar = [...ekstralar]
    .map((e) => e.id)
    .sort()
    .join(",");
  return `${urunId}::${anahtar}`;
}

const DEPO_ANAHTARI = "ny-sepet-v1";

/**
 * Mutfağın adı sepette SAKLANIR, sabit içerikten aranmaz.
 *
 * Şef ve ev hanımı mutfakları yönetici onayıyla çalışma zamanında açılıyor;
 * `content/restoranlar.ts` içinde kayıtları yok. Adı istemcide arayınca bu
 * mutfaklarda sepet ya boşalıyor ya da "sef-ornek" gibi slug gösteriyordu.
 */
type SepetDurumu = {
  restoranSlug: string | null;
  restoranAdi: string | null;
  kalemler: SiparisKalemi[];
};

/** Sepete ekleme yapan taraf mutfağın hem kimliğini hem adını verir. */
export type SepetMutfagi = { slug: string; ad: string };

const BOS: SepetDurumu = { restoranSlug: null, restoranAdi: null, kalemler: [] };

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
  ekle: (
    mutfak: SepetMutfagi,
    urun: Urun,
    adet?: number,
    ekstralar?: SecilenEkstra[],
  ) => EklemeSonucu;
  /** Onay sonrası: sepeti sıfırlayıp yeni restorandan ekler. */
  sifirlaVeEkle: (
    mutfak: SepetMutfagi,
    urun: Urun,
    adet?: number,
    ekstralar?: SecilenEkstra[],
  ) => void;
  adetAyarla: (satirId: string, adet: number) => void;
  kaldir: (satirId: string) => void;
  temizle: () => void;
  /** Ekstrasız (sade) satırın adedi — hızlı +/- kontrolü için. */
  urunAdedi: (urunId: string) => number;
  /** Uygulanan kupon kodu — geçerliliği her hesaplamada yeniden doğrulanır. */
  kuponKodu: string | null;
  kuponHatasi: string | null;
  kuponUygula: (kod: string) => boolean;
  kuponKaldir: () => void;
};

const SepetBaglami = createContext<SepetBaglamiTipi | null>(null);

export function SepetSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<SepetDurumu>(BOS);
  const [hazir, setHazir] = useState(false);
  const [cekmeceAcik, setCekmeceAcik] = useState(false);
  const [kuponKodu, setKuponKodu] = useState<string | null>(null);
  const [kuponHatasi, setKuponHatasi] = useState<string | null>(null);

  // localStorage'dan geri yükle (yalnızca ilk render sonrası — SSR uyumu için)
  useEffect(() => {
    try {
      const kayit = window.localStorage.getItem(DEPO_ANAHTARI);
      if (kayit) {
        const cozulen = JSON.parse(kayit) as SepetDurumu;
        /**
         * Slug'ın sabit içerikte olması ARANMAZ: şef mutfakları çalışma
         * zamanında açılıyor ve burada bulunamıyordu, bu yüzden o mutfaklarda
         * sepet her sayfa yenilemesinde siliniyordu. Kayıt biçimsel olarak
         * doğruysa yüklenir; ürünlerin geçerliliğini zaten sunucu denetliyor.
         */
        if (
          cozulen &&
          Array.isArray(cozulen.kalemler) &&
          (cozulen.restoranSlug === null || typeof cozulen.restoranSlug === "string")
        ) {
          setDurum({ ...cozulen, restoranAdi: cozulen.restoranAdi ?? null });
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

  const kalemEkle = useCallback(
    (mevcut: SiparisKalemi[], urun: Urun, adet: number, ekstralar?: SecilenEkstra[]) => {
      const satirId = satirIdUret(urun.id, ekstralar);
      const varOlan = mevcut.find((k) => k.satirId === satirId);
      if (varOlan) {
        return mevcut.map((k) =>
          k.satirId === satirId ? { ...k, adet: Math.min(99, k.adet + adet) } : k,
        );
      }
      return [
        ...mevcut,
        { satirId, urunId: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet, ekstralar },
      ];
    },
    [],
  );

  const ekle = useCallback<SepetBaglamiTipi["ekle"]>(
    (mutfak, urun, adet = 1, ekstralar) => {
      if (durum.restoranSlug && durum.restoranSlug !== mutfak.slug && durum.kalemler.length > 0) {
        return {
          durum: "farkli-restoran",
          mevcutRestoran: durum.restoranAdi ?? durum.restoranSlug,
        };
      }
      setDurum((o) => ({
        restoranSlug: mutfak.slug,
        restoranAdi: mutfak.ad,
        kalemler: kalemEkle(o.restoranSlug === mutfak.slug ? o.kalemler : [], urun, adet, ekstralar),
      }));
      return { durum: "eklendi" };
    },
    [durum.restoranSlug, durum.restoranAdi, durum.kalemler.length, kalemEkle],
  );

  const sifirlaVeEkle = useCallback<SepetBaglamiTipi["sifirlaVeEkle"]>(
    (mutfak, urun, adet = 1, ekstralar) => {
      setDurum({
        restoranSlug: mutfak.slug,
        restoranAdi: mutfak.ad,
        kalemler: kalemEkle([], urun, adet, ekstralar),
      });
    },
    [kalemEkle],
  );

  const adetAyarla = useCallback<SepetBaglamiTipi["adetAyarla"]>((satirId, adet) => {
    setDurum((o) => {
      if (adet <= 0) {
        const kalanlar = o.kalemler.filter((k) => k.satirId !== satirId);
        if (kalanlar.length === 0) return BOS;
        return { ...o, kalemler: kalanlar };
      }
      return {
        ...o,
        kalemler: o.kalemler.map((k) =>
          k.satirId === satirId ? { ...k, adet: Math.min(99, adet) } : k,
        ),
      };
    });
  }, []);

  const kaldir = useCallback<SepetBaglamiTipi["kaldir"]>(
    (satirId) => adetAyarla(satirId, 0),
    [adetAyarla],
  );

  const temizle = useCallback(() => {
    setDurum(BOS);
    setKuponKodu(null);
    setKuponHatasi(null);
  }, []);

  const kuponUygula = useCallback<SepetBaglamiTipi["kuponUygula"]>(
    (kod) => {
      const araToplam = durum.kalemler.reduce((t, k) => t + kalemBirimFiyati(k) * k.adet, 0);
      const sonuc = kuponuDogrula(kod, araToplam);
      if (!sonuc.gecerli) {
        setKuponHatasi(sonuc.hata);
        return false;
      }
      setKuponKodu(sonuc.kampanya.kod ?? kod.trim());
      setKuponHatasi(null);
      return true;
    },
    [durum.kalemler],
  );

  const kuponKaldir = useCallback(() => {
    setKuponKodu(null);
    setKuponHatasi(null);
  }, []);

  const deger = useMemo<SepetBaglamiTipi>(() => {
    const adetToplam = durum.kalemler.reduce((t, k) => t + k.adet, 0);
    return {
      restoranSlug: durum.restoranSlug,
      restoranAdi: durum.restoranAdi,
      kalemler: durum.kalemler,
      adetToplam,
      tutarlar: durum.restoranSlug
        ? tutarlariHesapla(durum.kalemler, durum.restoranSlug, kuponKodu ?? undefined)
        : null,
      hazir,
      cekmeceAcik,
      setCekmeceAcik,
      ekle,
      sifirlaVeEkle,
      adetAyarla,
      kaldir,
      temizle,
      urunAdedi: (urunId: string) => durum.kalemler.find((k) => k.satirId === urunId)?.adet ?? 0,
      kuponKodu,
      kuponHatasi,
      kuponUygula,
      kuponKaldir,
    };
  }, [
    durum,
    hazir,
    cekmeceAcik,
    ekle,
    sifirlaVeEkle,
    adetAyarla,
    kaldir,
    temizle,
    kuponKodu,
    kuponHatasi,
    kuponUygula,
    kuponKaldir,
  ]);

  return <SepetBaglami.Provider value={deger}>{children}</SepetBaglami.Provider>;
}

export function useSepet(): SepetBaglamiTipi {
  const baglam = useContext(SepetBaglami);
  if (!baglam) throw new Error("useSepet, SepetSaglayici içinde kullanılmalı.");
  return baglam;
}
