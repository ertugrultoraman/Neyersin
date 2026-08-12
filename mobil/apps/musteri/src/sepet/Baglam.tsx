import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { katalog, type SepetOzetiDto } from "ortak";

import { api } from "@/altyapi/api";

const uclar = katalog(api);

/** Sürüm eki: biçim değişirse eski kayıt sessizce göz ardı edilsin. */
const DEPO_ANAHTARI = "ny-sepet-v1";

/**
 * SEPET.
 *
 * Cihazda tutulan kısım YALNIZCA "ne ve kaç tane". Fiyat, teslimat ücreti,
 * kupon indirimi ve minimum sepet kuralı sunucudan geliyor (bkz.
 * /api/mobil/v1/sepet/ozet). Tutar burada hesaplansaydı:
 *  - mutfak fiyatını sepet açıkken güncellediğinde iki taraf ayrışırdı,
 *  - kupon kuralları uygulamaya kopyalanmak zorunda kalırdı ve mağaza
 *    güncellemesi beklemeden değiştirilemezdi,
 *  - ödenecek tutar kullanıcının değiştirebildiği bir sayıya bağlı olurdu.
 *
 * TEK MUTFAK KURALI web'dekiyle aynı: farklı bir mutfaktan ürün eklenmek
 * istendiğinde sepet KENDİLİĞİNDEN boşalmıyor, çağıran tarafa sinyal
 * dönüyor ve onay kullanıcıya soruluyor.
 */

export type SepetKalemi = {
  /**
   * Sepetteki satırın kimliği: ürün + seçili ekstralar.
   *
   * Ürün kimliği TEK BAŞINA yetmiyor — aynı kanadı biri sade, biri ekstra
   * soslu isteyen kişi iki ayrı satır görmeli. Kural sunucudaki
   * `lib/mobil/sepet.ts` ve web'deki `satirIdUret` ile aynı; üçü ayrışırsa
   * aynı sepet iki platformda farklı gruplanır.
   */
  satirId: string;
  urunId: string;
  ad: string;
  adet: number;
  ekstraIdler?: string[];
};

export function satirIdUret(urunId: string, ekstraIdler?: string[]): string {
  if (!ekstraIdler || ekstraIdler.length === 0) return urunId;
  return `${urunId}::${[...ekstraIdler].sort().join(",")}`;
}

type Depo = {
  restoranSlug: string | null;
  restoranAdi: string | null;
  kalemler: SepetKalemi[];
  kuponKodu: string | null;
};

const BOS: Depo = { restoranSlug: null, restoranAdi: null, kalemler: [], kuponKodu: null };

export type Mutfak = { slug: string; ad: string };

type EklemeSonucu = { durum: "eklendi" } | { durum: "farkli-mutfak"; mevcutMutfak: string };

type SepetBaglami = {
  restoranSlug: string | null;
  restoranAdi: string | null;
  kalemler: SepetKalemi[];
  adetToplam: number;
  /** Sunucudan gelen hesap; sepet boşken ya da henüz sorulmamışken `null`. */
  ozet: SepetOzetiDto | null;
  hesaplaniyor: boolean;
  /** Cihazdaki kayıt okundu mu — okunmadan sepet rozeti çizilmemeli. */
  hazir: boolean;
  ekle: (mutfak: Mutfak, kalem: SepetKalemi) => EklemeSonucu;
  sifirlaVeEkle: (mutfak: Mutfak, kalem: SepetKalemi) => void;
  adetAyarla: (satirId: string, adet: number) => void;
  /**
   * Menü satırındaki +/- için: yalnızca EKSTRASIZ satırın adedi.
   *
   * Bütün satırların toplamı verilseydi, ekstralı bir kombinasyon eklendikten
   * sonra menüdeki "-" düğmesi hangi satırı azaltacağını bilemezdi. Web de
   * aynı kuralı kullanıyor.
   */
  urunAdedi: (urunId: string) => number;
  kuponAyarla: (kod: string | null) => void;
  kuponKodu: string | null;
  temizle: () => void;
};

const Baglam = createContext<SepetBaglami | null>(null);

export function SepetSaglayici({ children }: { children: ReactNode }) {
  const [depo, setDepo] = useState<Depo>(BOS);
  const [hazir, setHazir] = useState(false);
  const [ozet, setOzet] = useState<SepetOzetiDto | null>(null);
  const [hesaplaniyor, setHesaplaniyor] = useState(false);

  /* --- Cihazdaki kayıt ------------------------------------------------- */

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const kayit = await AsyncStorage.getItem(DEPO_ANAHTARI);
        if (kayit && !iptal) {
          const cozulen = JSON.parse(kayit) as Depo;
          /*
           * Ürünlerin hâlâ satılıp satılmadığı BURADA denetlenmiyor; sunucu
           * özeti hesaplarken düşenleri zaten bildiriyor. Burada denetlemek,
           * aynı kuralın ikinci bir kopyası olurdu.
           */
          if (cozulen && Array.isArray(cozulen.kalemler)) {
            setDepo({ ...BOS, ...cozulen });
          }
        }
      } catch {
        /* Bozuk kayıt — boş sepetle devam. */
      }
      if (!iptal) setHazir(true);
    })();
    return () => {
      iptal = true;
    };
  }, []);

  useEffect(() => {
    if (!hazir) return;
    AsyncStorage.setItem(DEPO_ANAHTARI, JSON.stringify(depo)).catch(() => {
      /* Disk doluysa sepet oturum içinde çalışmaya devam eder. */
    });
  }, [depo, hazir]);

  /* --- Sunucudan hesap -------------------------------------------------- */

  /** Geç dönen eski istek yeni sonucu ezmesin. */
  const sira = useRef(0);

  useEffect(() => {
    if (!hazir) return;

    if (!depo.restoranSlug || depo.kalemler.length === 0) {
      setOzet(null);
      return;
    }

    const benim = ++sira.current;
    setHesaplaniyor(true);

    uclar
      .sepetOzeti({
        restoranSlug: depo.restoranSlug,
        kalemler: depo.kalemler.map((k) => ({
          urunId: k.urunId,
          adet: k.adet,
          ...(k.ekstraIdler ? { ekstraIdler: k.ekstraIdler } : {}),
        })),
        ...(depo.kuponKodu ? { kuponKodu: depo.kuponKodu } : {}),
      })
      .then((sonuc) => {
        if (benim !== sira.current) return;
        setOzet(sonuc);
        /*
         * Satılmayan ürünler sepetten DÜŞÜRÜLÜYOR. Bırakılsalardı her
         * hesaplamada yeniden düşer, kullanıcı da sepette duran ama tutara
         * girmeyen bir satır görürdü.
         */
        if (sonuc.dusenKalemler.length > 0) {
          setDepo((o) => ({
            ...o,
            kalemler: o.kalemler.filter((k) => !sonuc.dusenKalemler.includes(k.urunId)),
          }));
        }
      })
      .catch(() => {
        /*
         * Ağ hatasında SON GEÇERLİ ÖZET ekranda kalıyor, sepet silinmiyor.
         * Sıfırlansaydı asansörde sepeti açan kullanıcı her şeyini kaybederdi.
         */
      })
      .finally(() => {
        if (benim === sira.current) setHesaplaniyor(false);
      });
  }, [depo, hazir]);

  /* --- İşlemler --------------------------------------------------------- */

  const ekle = useCallback<SepetBaglami["ekle"]>(
    (mutfak, kalem) => {
      if (depo.restoranSlug && depo.restoranSlug !== mutfak.slug && depo.kalemler.length > 0) {
        return { durum: "farkli-mutfak", mevcutMutfak: depo.restoranAdi ?? depo.restoranSlug };
      }
      setDepo((o) => ({
        ...o,
        restoranSlug: mutfak.slug,
        restoranAdi: mutfak.ad,
        kalemler: kalemEkle(o.restoranSlug === mutfak.slug ? o.kalemler : [], kalem),
      }));
      return { durum: "eklendi" };
    },
    [depo.restoranSlug, depo.restoranAdi, depo.kalemler.length],
  );

  const sifirlaVeEkle = useCallback<SepetBaglami["sifirlaVeEkle"]>((mutfak, kalem) => {
    setDepo({
      restoranSlug: mutfak.slug,
      restoranAdi: mutfak.ad,
      kalemler: kalemEkle([], kalem),
      /* Kupon da düşüyor: eski mutfağın sepetine göre geçerliydi. */
      kuponKodu: null,
    });
  }, []);

  const adetAyarla = useCallback<SepetBaglami["adetAyarla"]>((satirId, adet) => {
    setDepo((o) => {
      const kalanlar =
        adet <= 0
          ? o.kalemler.filter((k) => k.satirId !== satirId)
          : o.kalemler.map((k) => (k.satirId === satirId ? { ...k, adet: Math.min(99, adet) } : k));
      /* Son kalem de silindiyse mutfak bağı bırakılıyor — sepet gerçekten boş. */
      return kalanlar.length === 0 ? BOS : { ...o, kalemler: kalanlar };
    });
  }, []);

  const kuponAyarla = useCallback<SepetBaglami["kuponAyarla"]>((kod) => {
    setDepo((o) => ({ ...o, kuponKodu: kod?.trim() || null }));
  }, []);

  const temizle = useCallback(() => setDepo(BOS), []);

  const deger = useMemo<SepetBaglami>(
    () => ({
      restoranSlug: depo.restoranSlug,
      restoranAdi: depo.restoranAdi,
      kalemler: depo.kalemler,
      adetToplam: depo.kalemler.reduce((t, k) => t + k.adet, 0),
      ozet,
      hesaplaniyor,
      hazir,
      ekle,
      sifirlaVeEkle,
      adetAyarla,
      urunAdedi: (urunId) => depo.kalemler.find((k) => k.satirId === urunId)?.adet ?? 0,
      kuponAyarla,
      kuponKodu: depo.kuponKodu,
      temizle,
    }),
    [depo, ozet, hesaplaniyor, hazir, ekle, sifirlaVeEkle, adetAyarla, kuponAyarla, temizle],
  );

  return <Baglam value={deger}>{children}</Baglam>;
}

/** Aynı satır (ürün + aynı ekstralar) zaten varsa adedi artıyor, yoksa yeni satır. */
function kalemEkle(mevcut: SepetKalemi[], yeni: SepetKalemi): SepetKalemi[] {
  const varOlan = mevcut.find((k) => k.satirId === yeni.satirId);
  if (!varOlan) return [...mevcut, yeni];
  return mevcut.map((k) =>
    k.satirId === yeni.satirId ? { ...k, adet: Math.min(99, k.adet + yeni.adet) } : k,
  );
}

export function useSepet(): SepetBaglami {
  const baglam = use(Baglam);
  if (!baglam) throw new Error("useSepet, SepetSaglayici içinde çağrılmalı.");
  return baglam;
}
