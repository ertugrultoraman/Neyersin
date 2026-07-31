import type { Siparis, SiparisDurumu } from "../siparis";

export type KayitliSiparis = Siparis & {
  /** iyzico paymentId — iade ve mutabakat için. */
  saglayiciOdemeId?: string;
  odenenTutar?: string;
  /** Son durum değişikliği zamanı (ISO). */
  guncellemeTarihi: string;
  /** Ödeme başarısızsa sağlayıcıdan gelen mesaj. */
  odemeMesaji?: string;
};

export type SiparisFiltresi = {
  durum?: SiparisDurumu;
  /** Sipariş no, telefon, ad veya ilçede geçen metin. */
  arama?: string;
  limit?: number;
};

export type Ozet = {
  toplamSiparis: number;
  odemeBekleyen: number;
  odenen: number;
  basarisiz: number;
  /** Yalnızca ödenmiş siparişlerin toplamı (TL). */
  odenenCiro: number;
  bugunSiparis: number;
};

/**
 * Sipariş saklama arayüzü. İki uygulaması var:
 *  - `DosyaDepo`  → yerel geliştirme ve kalıcı diskli sunucular
 *  - `PostgresDepo` → DATABASE_URL tanımlıysa (Vercel/Neon/Supabase)
 */
export type SiparisDepo = {
  ad: string;
  kalici: boolean;
  hazirla(): Promise<void>;
  ekle(siparis: Siparis): Promise<void>;
  durumGuncelle(
    siparisNo: string,
    durum: SiparisDurumu,
    ek?: { saglayiciOdemeId?: string; odenenTutar?: string; odemeMesaji?: string },
  ): Promise<void>;
  listele(filtre?: SiparisFiltresi): Promise<KayitliSiparis[]>;
  bul(siparisNo: string): Promise<KayitliSiparis | null>;
  ozet(): Promise<Ozet>;

  /**
   * Bu e-posta ile daha önce kaç sipariş açılmış? "İlk siparişe özel" kuponu
   * doğrulamak için kullanılır. Ödemesi başarısız olan siparişler sayılmaz —
   * kart hatası yüzünden kupon hakkı yanmamalı.
   */
  epostaSiparisSayisi(eposta: string): Promise<number>;

  /** Bu e-posta bu kupon kodunu daha önce kullandı mı? */
  kuponKullanildiMi(eposta: string, kod: string): Promise<boolean>;
};

/** İki adaptörün ortak sayım mantığı — başarısız ödemeler hariç tutulur. */
export function gecerliSiparisler(siparisler: KayitliSiparis[]): KayitliSiparis[] {
  return siparisler.filter((s) => s.durum !== "odeme-basarisiz");
}

export function epostaEsit(a: string | undefined, b: string): boolean {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

export function ozetHesapla(siparisler: KayitliSiparis[]): Ozet {
  const bugun = new Date().toISOString().slice(0, 10);
  return {
    toplamSiparis: siparisler.length,
    odemeBekleyen: siparisler.filter((s) => s.durum === "odeme-bekliyor").length,
    odenen: siparisler.filter((s) => s.durum === "odendi").length,
    basarisiz: siparisler.filter((s) => s.durum === "odeme-basarisiz").length,
    odenenCiro: siparisler
      .filter((s) => s.durum === "odendi")
      .reduce((t, s) => t + s.tutarlar.toplam, 0),
    bugunSiparis: siparisler.filter((s) => s.olusturmaTarihi.slice(0, 10) === bugun).length,
  };
}

/** Filtreyi bellek içi listeye uygular — iki adaptör de aynı davranışı verir. */
export function filtreUygula(
  siparisler: KayitliSiparis[],
  filtre?: SiparisFiltresi,
): KayitliSiparis[] {
  let sonuc = siparisler;

  if (filtre?.durum) {
    sonuc = sonuc.filter((s) => s.durum === filtre.durum);
  }

  const arama = filtre?.arama?.trim().toLocaleLowerCase("tr-TR");
  if (arama) {
    sonuc = sonuc.filter((s) =>
      [s.siparisNo, s.musteri.adSoyad, s.musteri.telefon, s.musteri.eposta, s.adres.ilce, s.restoranAdi]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(arama),
    );
  }

  sonuc = [...sonuc].sort((a, b) => b.olusturmaTarihi.localeCompare(a.olusturmaTarihi));

  return filtre?.limit ? sonuc.slice(0, filtre.limit) : sonuc;
}
