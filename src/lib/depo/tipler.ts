import { tamamlandiMi } from "../siparis";
import type { Siparis, SiparisDurumu } from "../siparis";

export type KayitliSiparis = Siparis & {
  /** iyzico paymentId — iade ve mutabakat için. */
  saglayiciOdemeId?: string;
  odenenTutar?: string;
  /** Son durum değişikliği zamanı (ISO). */
  guncellemeTarihi: string;
  /** Ödeme başarısızsa sağlayıcıdan gelen mesaj. */
  odemeMesaji?: string;
  /** Siparişi hazırlayacak şef/ev hanımı hesabının e-postası. */
  atananSef?: string;
  /**
   * Teslimatı yapacak TEK kurye hesabının e-postası.
   *
   * Bir sipariş yalnızca bir kuryeye atanır ve kurye panelinde yalnızca kendi
   * ataması listelenir — atanmamış sipariş hiçbir kuryeye görünmez.
   * (İleride atama, adres ile kuryenin konumu arasındaki yakınlığa göre
   * otomatik yapılacak; alan yapısı aynı kalır, yalnızca kimin atandığını
   * seçen mantık değişir.)
   */
  atananKurye?: string;
};

export type SiparisFiltresi = {
  durum?: SiparisDurumu;
  /** Sipariş no, telefon, ad veya ilçede geçen metin. */
  arama?: string;
  limit?: number;
  /** Yalnızca bu restorana ait siparişler. */
  restoranSlug?: string;
  /** Yalnızca bu şefe atanmış siparişler. */
  atananSef?: string;
  /** Yalnızca bu kuryeye atanmış siparişler. */
  atananKurye?: string;
  /** Yalnızca bu müşterinin (e-posta) siparişleri. */
  musteriEpostasi?: string;
};

/** Sipariş atamasında güncellenebilen alanlar. */
export type Atama = {
  atananSef?: string | null;
  atananKurye?: string | null;
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

  /** Siparişe şef ve/veya kurye atar. `null` geçilen alan temizlenir. */
  atamaGuncelle(siparisNo: string, atama: Atama): Promise<void>;

  /**
   * Kişi e-posta adresini değiştirdiğinde geçmiş siparişlerini yeni adrese taşır.
   *
   * İki nedenle şart:
   *  1. Sipariş geçmişi kişinin kendisine ait; adres değişti diye kaybolmamalı.
   *  2. "İlk siparişe özel" kuponu e-posta başına sayılıyor. Siparişler eski
   *     adreste kalsaydı, adresini değiştiren herkes kendini yeniden "ilk
   *     sipariş" gösterip kuponu tekrar tekrar kullanabilirdi.
   *
   * @returns Taşınan sipariş sayısı.
   */
  musteriEpostasiniTasi(eski: string, yeni: string): Promise<number>;
};

/**
 * İki adaptörün ortak sayım mantığı — kupon hakkını yakmayan siparişler elenir.
 * Ödemesi başarısız olan ve müşterinin iptal ettiği siparişler sayılmaz.
 */
export function gecerliSiparisler(siparisler: KayitliSiparis[]): KayitliSiparis[] {
  return siparisler.filter((s) => s.durum !== "odeme-basarisiz" && s.durum !== "iptal");
}

export function epostaEsit(a: string | undefined, b: string): boolean {
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

export function ozetHesapla(siparisler: KayitliSiparis[]): Ozet {
  const bugun = new Date().toISOString().slice(0, 10);
  return {
    toplamSiparis: siparisler.length,
    odemeBekleyen: siparisler.filter((s) => s.durum === "odeme-bekliyor").length,
    // Ciro: teslim edilmis VE odenmis siparisler (odendi eski kayitlar icin).
    odenen: siparisler.filter((s) => tamamlandiMi(s.durum)).length,
    basarisiz: siparisler.filter((s) => s.durum === "odeme-basarisiz").length,
    odenenCiro: siparisler
      .filter((s) => tamamlandiMi(s.durum))
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
  if (filtre?.restoranSlug) {
    sonuc = sonuc.filter((s) => s.restoranSlug === filtre.restoranSlug);
  }
  if (filtre?.atananSef) {
    sonuc = sonuc.filter((s) => epostaEsit(s.atananSef, filtre.atananSef!));
  }
  if (filtre?.atananKurye) {
    sonuc = sonuc.filter((s) => epostaEsit(s.atananKurye, filtre.atananKurye!));
  }
  if (filtre?.musteriEpostasi) {
    sonuc = sonuc.filter((s) => epostaEsit(s.musteri?.eposta, filtre.musteriEpostasi!));
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
