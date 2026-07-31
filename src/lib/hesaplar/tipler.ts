/**
 * Oturum açan kişinin yetki düzeyi.
 *
 *  - admin   : her şeye erişir, başvuruları onaylar, atamaları yapar
 *  - sef     : kendi profilini düzenler, kendine düşen siparişleri görür
 *  - kurye   : kendine atanan siparişleri ve teslimat adresini görür
 *  - musteri : sipariş verir, kendi sipariş geçmişini görür
 */
export type Rol = "admin" | "sef" | "kurye" | "musteri";

export type Hesap = {
  /** Benzersiz kimlik — her zaman küçük harfe indirgenmiş e-posta. */
  eposta: string;
  ad: string;
  /** scrypt ile türetilmiş `tuz:ozet` — düz parola hiçbir yerde saklanmaz. */
  parolaHash: string;
  rol: Rol;
  telefon?: string;
  /**
   * Şef hesabının sahibi olduğu restoran slug'ı. Bir şef YALNIZCA bu profili
   * düzenleyebilir; diğerlerini sadece görüntüler.
   */
  restoranSlug?: string;
  olusturmaTarihi: string;
};

/**
 * Şefin kendi düzenlediği profil alanları. İçerik dosyalarındaki (restoranlar.ts)
 * statik veriyi EZMEZ, üzerine biner — böylece şef bir alanı boş bırakırsa
 * sitedeki varsayılan metin görünmeye devam eder.
 *
 * Doğrudan iletişim alanı bilinçli olarak YOK: müşteri şefe platform dışından
 * ulaşamamalı, tüm iletişim sipariş üzerinden yürür.
 */
export type SefProfili = {
  restoranSlug: string;
  /** Özgeçmiş / hikaye. */
  biyografi?: string;
  /** Sertifikalar, kurslar, belgeler — serbest metin, satır satır girilir. */
  sertifikalar?: string;
  /** "Ev usulü mantı ve hamur işleri" gibi kısa uzmanlık cümlesi. */
  uzmanlik?: string;
  /** Profilin üstünde görünen kısa slogan. */
  slogan?: string;
  guncellemeTarihi: string;
};

/** Başvuru türleri — kayıt olmak isteyen kişi bunlardan birini seçer. */
export type BasvuruTuru = "sef" | "ev-hanimi" | "kurye";

export type BasvuruDurumu = "bekliyor" | "onaylandi" | "reddedildi";

/**
 * Şef / ev hanımı / kurye olmak isteyenlerin talebi.
 *
 * Kimse doğrudan şef hesabı açamaz: önce başvurur, yönetici onaylayıp bir profil
 * atar, ancak ondan sonra kayıt tamamlanabilir.
 */
export type Basvuru = {
  id: string;
  ad: string;
  telefon: string;
  eposta: string;
  tur: BasvuruTuru;
  mesaj?: string;
  /**
   * Başvuru sırasında belirlenen parolanın scrypt özeti.
   * Onaylandığı anda hesap bu özetle açılır; kişi ayrıca kayıt olmaz,
   * doğrudan giriş yapar. Düz parola hiçbir yerde saklanmaz.
   */
  parolaHash: string;
  durum: BasvuruDurumu;
  /** Onaylandıysa hangi profile atandı (şef / ev hanımı başvuruları için). */
  atananRestoran?: string;
  /** Yöneticinin bıraktığı not — ret gerekçesi vb. */
  yoneticiNotu?: string;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
};

/**
 * Yönetici onayıyla açılan şef/ev hanımı mutfağı.
 *
 * İçerik dosyasındaki (restoranlar.ts) sabit restoranların yanına, çalışma
 * zamanında oluşan profiller için ayrı bir kayıt. Site listesinde ikisi
 * birleştirilerek gösterilir (bkz. lib/restoran-listesi.ts).
 */
export type SefMutfagi = {
  /** URL'de kullanılan benzersiz kimlik. */
  slug: string;
  ad: string;
  sefTuru: "sef" | "ev-hanimi";
  semt: string;
  /** Mutfağın sahibi olan hesabın e-postası. */
  sahipEposta: string;
  olusturmaTarihi: string;
};

/**
 * Sipariş değerlendirmesi.
 *
 * Proje dosyasındaki modele göre üç ayrı eksende puanlanır:
 * SICAKLIK, TESLİMAT HIZI ve TAD. Ortalama bu üçünün ortalamasıdır.
 * Yalnızca o siparişi gerçekten veren müşteri, sipariş başına bir kez yazabilir.
 */
export type Yorum = {
  id: string;
  restoranSlug: string;
  siparisNo: string;
  musteriEposta: string;
  musteriAdi: string;
  /** 1–5 arası. */
  sicaklik: number;
  teslimatHizi: number;
  tad: number;
  metin?: string;
  tarih: string;
};

export type YorumOzeti = {
  adet: number;
  ortalama: number;
  sicaklik: number;
  teslimatHizi: number;
  tad: number;
};

export type HesapDepo = {
  ad: string;
  kalici: boolean;
  hazirla(): Promise<void>;

  hesapBul(eposta: string): Promise<Hesap | null>;
  hesapEkle(hesap: Hesap): Promise<void>;
  hesapSil(eposta: string): Promise<void>;
  hesaplariListele(rol?: Rol): Promise<Hesap[]>;
  /** Bir restoranın şef hesabı zaten var mı? (aynı profil iki kez sahiplenilemez) */
  restoranSahibi(restoranSlug: string): Promise<Hesap | null>;

  profilAl(restoranSlug: string): Promise<SefProfili | null>;
  profilleriListele(): Promise<SefProfili[]>;
  profilKaydet(profil: SefProfili): Promise<void>;

  basvuruEkle(basvuru: Basvuru): Promise<void>;
  basvuruBul(id: string): Promise<Basvuru | null>;
  /** Kayıt sırasında "bu e-posta onaylandı mı?" kontrolü için. */
  basvuruBulEposta(eposta: string): Promise<Basvuru | null>;
  basvurulariListele(durum?: BasvuruDurumu): Promise<Basvuru[]>;
  basvuruGuncelle(basvuru: Basvuru): Promise<void>;

  yorumEkle(yorum: Yorum): Promise<void>;
  yorumlariListele(restoranSlug?: string): Promise<Yorum[]>;
  /** Bu sipariş için zaten yorum yazılmış mı? */
  siparisYorumlandiMi(siparisNo: string): Promise<boolean>;

  mutfakEkle(mutfak: SefMutfagi): Promise<void>;
  mutfakBul(slug: string): Promise<SefMutfagi | null>;
  mutfakSil(slug: string): Promise<void>;
  mutfaklariListele(): Promise<SefMutfagi[]>;
};

/** Yorum listesinden özet çıkarır — iki adaptörde de aynı hesap kullanılsın. */
export function yorumOzetiHesapla(yorumlar: Yorum[]): YorumOzeti {
  if (yorumlar.length === 0) {
    return { adet: 0, ortalama: 0, sicaklik: 0, teslimatHizi: 0, tad: 0 };
  }
  const ort = (secici: (y: Yorum) => number) =>
    Math.round((yorumlar.reduce((t, y) => t + secici(y), 0) / yorumlar.length) * 10) / 10;

  const sicaklik = ort((y) => y.sicaklik);
  const teslimatHizi = ort((y) => y.teslimatHizi);
  const tad = ort((y) => y.tad);

  return {
    adet: yorumlar.length,
    ortalama: Math.round(((sicaklik + teslimatHizi + tad) / 3) * 10) / 10,
    sicaklik,
    teslimatHizi,
    tad,
  };
}
