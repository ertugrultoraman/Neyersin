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
  /**
   * E-posta adresi doğrulama koduyla teyit edildi mi?
   *
   * Kayıt sırasında ikinci adımda doğrulanır. Doğrulanmamış hesap giriş
   * YAPABİLİR — kişiyi kapıda bırakmak yerine profilinde uyarı gösterilir;
   * ama parola sıfırlama gibi e-postaya güvenen akışlar doğrulama ister.
   */
  epostaDogrulandi?: boolean;
  olusturmaTarihi: string;
};

/** Doğrulama kodunun ne için üretildiği. */
export type KodAmaci = "kayit" | "sifre";

/**
 * E-postaya gönderilen tek kullanımlık kod.
 *
 * Kod ÖZETLENEREK saklanır (scrypt) — veritabanını gören biri kodları
 * okuyup hesap ele geçiremesin. Tek istisna: SMTP yapılandırılmadığı için
 * posta gönderilemediyse kod `duzKod` alanına yazılır ve YALNIZCA yönetici
 * panelinde görünür; böylece posta hazır olmadan da akış işletilebiliyor.
 * SMTP tanımlıysa `duzKod` hiçbir zaman doldurulmaz.
 */
export type DogrulamaKodu = {
  id: string;
  eposta: string;
  amac: KodAmaci;
  kodOzeti: string;
  duzKod?: string;
  /** Yanlış deneme sayısı — 5'te kod yanar. */
  deneme: number;
  kullanildi: boolean;
  /** Posta gerçekten gönderilebildi mi? */
  gonderildi: boolean;
  sonGecerlilik: string;
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

/**
 * Şefin / ev hanımının kendi panelinden eklediği ürün.
 *
 * Sabit içerikteki menüyü (content/menuler.ts) EZMEZ, üstüne biner: iki kaynak
 * profil sayfasında bölümlerine göre birleştirilir (bkz. lib/mutfak-menusu.ts).
 * Böylece bir ev hanımı kendi tereyağını, yoğurdunu, reçelini kimseye sormadan
 * ekleyebiliyor; kod değişikliği gerekmiyor.
 *
 * Fiyat KİŞİNİN KENDİ KARARI. Boş bırakılırsa (0) ürün menüde "fiyat yakında"
 * olarak görünür ama sepete eklenemez — uydurma fiyat yazmak yerine ürünün
 * fiyatsız durması tercih edildi.
 */
export type MutfakUrunu = {
  id: string;
  restoranSlug: string;
  /** content/mutfak-bolumleri.ts'deki bölüm kimliği — "ana-yemek", "ev-yapimi"… */
  bolum: string;
  ad: string;
  aciklama: string;
  /** TL. 0 → fiyat henüz girilmedi. */
  fiyat: number;
  /** "500 g cam kavanoz", "1 L şişe" gibi ambalaj bilgisi. */
  birim?: string;
  /** Kapalıysa yalnızca panelde görünür, müşteriye çıkmaz. */
  yayinda: boolean;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
};

export type DestekDurumu = "acik" | "cozuldu";

/**
 * Destek talebi.
 *
 * Canlı destek asistanı çözemediğinde (ya da kullanıcı doğrudan istediğinde)
 * açılan kayıt. Sipariş numarası varsa talebi o siparişe bağlar; yönetici
 * panelinde listelenir.
 */
export type DestekTalebi = {
  id: string;
  /** Kullanıcıya gösterilen kısa numara: DT-260801-4821 */
  no: string;
  konu: string;
  mesaj: string;
  siparisNo?: string;
  ad: string;
  eposta: string;
  telefon?: string;
  durum: DestekDurumu;
  yanit?: string;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
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

  destekEkle(talep: DestekTalebi): Promise<void>;
  destekListele(durum?: DestekDurumu): Promise<DestekTalebi[]>;
  destekGuncelle(talep: DestekTalebi): Promise<void>;

  /** Yeni ürün ekler ya da aynı kimlikli ürünü günceller. */
  urunKaydet(urun: MutfakUrunu): Promise<void>;
  urunBul(id: string): Promise<MutfakUrunu | null>;
  urunSil(id: string): Promise<void>;
  /** Slug verilmezse TÜM mutfakların ürünleri döner (yönetici görünümü). */
  urunleriListele(restoranSlug?: string): Promise<MutfakUrunu[]>;

  kodKaydet(kod: DogrulamaKodu): Promise<void>;
  /** Bir e-posta/amaç için en son üretilen, henüz kullanılmamış kod. */
  sonKodBul(eposta: string, amac: KodAmaci): Promise<DogrulamaKodu | null>;
  kodlariListele(): Promise<DogrulamaKodu[]>;
  /** Aynı e-posta/amaç için eski kodları geçersiz kılar. */
  kodlariTuket(eposta: string, amac: KodAmaci): Promise<void>;
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
