/**
 * MOBİL API SÖZLEŞMESİ — sunucudaki `src/lib/mobil/tipler.ts` dosyasının aynası.
 *
 * NEDEN KOPYA: mobil uygulamalar Next.js kaynak ağacını import edemiyor —
 * ayrı bir npm çalışma alanı, ayrı derleyici, ayrı `tsconfig`. Sunucu tipleri
 * `next/server` ve veritabanı modüllerine dokunan dosyalardan geliyor;
 * Metro onları paketlemeye çalışırsa derleme patlar.
 *
 * NASIL SENKRON KALIYOR: `npm run test:mobil-sozlesme` iki dosyayı karşılaştırıp
 * ayrışma varsa hata veriyor. Elle eşitlemeye güvenilmiyor; sözleşmenin sessizce
 * ayrışması, uygulamanın sunucudan gelen alanı okuyamayıp `undefined` göstermesi
 * demek ve bu hata ancak çalışma anında fark ediliyor.
 *
 * Sunucu tarafında `Rol`, `SiparisDurumu` ve `Tutarlar` domain modüllerinden
 * import ediliyor; burada satır içine yazılmak zorundalar.
 */

/* --- Sunucudaki domain tiplerinin karşılıkları -------------------------- */

/** Ayna: src/lib/hesaplar/tipler.ts → ROLLER */
export type Rol = "admin" | "sef" | "isletme" | "kurye" | "musteri";

/** Ayna: src/lib/siparis.ts → SiparisDurumu */
export type SiparisDurumu =
  | "odeme-bekliyor"
  | "odendi"
  | "hazir"
  | "yolda"
  | "teslim-edildi"
  | "odeme-basarisiz"
  | "iptal";

/** Teslimat akışındaki sıralı adımlar — ilerleme çubuğu bunu çiziyor. */
export const TESLIMAT_ADIMLARI = ["odendi", "hazir", "yolda", "teslim-edildi"] as const;

/** Ayna: src/lib/siparis.ts → Tutarlar */
export type Tutarlar = {
  araToplam: number;
  teslimatUcreti: number;
  indirim: number;
  kuponKodu?: string;
  toplam: number;
  minSepet: number;
  minSepetKarsilandi: boolean;
};

/* --------------------------------------------------------------------------
 * Kimlik
 * ----------------------------------------------------------------------- */

export type KullaniciDto = {
  eposta: string;
  ad: string;
  rol: Rol;
  /** Şef/işletme ise yönettiği mutfak. */
  restoranSlug?: string;
  isletmeYetkisi?: "sahip" | "calisan";
  epostaDogrulandi: boolean;
  fotografUrl?: string;
  telefon?: string;
};

export type OturumCevabi = {
  erisimJetonu: string;
  yenilemeJetonu: string;
  /** Erişim jetonunun ömrü (saniye) — istemci süresi dolmadan tazeleyebilsin. */
  erisimSuresi: number;
  kullanici: KullaniciDto;
};

export type GirisGirdisi = {
  kimlik: string;
  parola: string;
  /**
   * Cihaz kimliği — uygulama ilk açılışta üretip güvenli alanda saklıyor.
   *
   * Push jetonunu doğru cihaza bağlamak ve "bu cihazdan çıkış yap" diyebilmek
   * için gerekiyor. Kişi aynı hesaba telefon ve tabletten girdiğinde iki ayrı
   * kayıt oluşuyor; biri çıkış yaptığında diğerinin bildirimleri kesilmiyor.
   */
  cihaz: string;
};

export type YenilemeGirdisi = { yenilemeJetonu: string; cihaz: string };

/* --------------------------------------------------------------------------
 * Katalog
 * ----------------------------------------------------------------------- */

export type RestoranOzetDto = {
  slug: string;
  ad: string;
  mutfak: string;
  semt: string;
  puan: number;
  yorumSayisi: number;
  teslimatSuresi: string;
  teslimatUcreti: number;
  minSepet: number;
  gorselUrl?: string;
  /** Şu an sipariş alıyor mu (çalışma saatleri + açık/kapalı). */
  acik: boolean;
  /** "Altın Şef", "Ayın Hanımı" gibi rozetler. */
  rozetler: string[];
  sefTuru?: "sef" | "ev-hanimi" | "isletme";
};

export type UrunDto = {
  id: string;
  ad: string;
  aciklama: string;
  /** TL. 0 → fiyat henüz girilmedi, sepete eklenemez. */
  fiyat: number;
  birim?: string;
  gorselUrl?: string;
  bolum: string;
};

export type MenuBolumuDto = {
  id: string;
  baslik: string;
  urunler: UrunDto[];
};

export type RestoranDetayDto = RestoranOzetDto & {
  hikaye?: string;
  uzmanlik?: string;
  slogan?: string;
  sertifikalar?: string;
  teslimatBolgeleri: string[];
  menu: MenuBolumuDto[];
  yorumOzeti: { adet: number; ortalama: number; sicaklik: number; teslimatHizi: number; tad: number };
};

export type KategoriDto = {
  slug: string;
  ad: string;
  gorselUrl?: string;
};

/* --------------------------------------------------------------------------
 * Sipariş
 * ----------------------------------------------------------------------- */

export type SiparisKalemDto = {
  satirId: string;
  urunId: string;
  ad: string;
  fiyat: number;
  adet: number;
  ekstralar?: { id: string; ad: string; fiyat: number }[];
};

export type SiparisOzetDto = {
  siparisNo: string;
  restoranSlug: string;
  restoranAdi: string;
  durum: SiparisDurumu;
  tutarlar: Tutarlar;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
  kalemSayisi: number;
};

export type SiparisDetayDto = SiparisOzetDto & {
  kalemler: SiparisKalemDto[];
  adres: {
    ilce: string;
    mahalle: string;
    acikAdres: string;
    binaNo: string;
    daireNo: string;
    tarif: string;
  };
  not: string;
  odemeYontemi: string;
  /** Bu sipariş için değerlendirme yazılabilir mi? */
  yorumlanabilir: boolean;
};

/* --------------------------------------------------------------------------
 * Kurye & canlı takip
 * ----------------------------------------------------------------------- */

export type KonumDto = {
  enlem: number;
  boylam: number;
  /** Metre cinsinden ölçüm hatası — haritada belirsizlik dairesi çiziliyor. */
  dogruluk?: number;
  /** Derece (0-360), kuryenin baktığı yön — ikonu döndürmek için. */
  yon?: number;
  /** m/s. Varış tahmini bundan hesaplanıyor. */
  hiz?: number;
  tarih: string;
};

/** Kuryeye gösterilen iş teklifi. */
export type TeklifDto = {
  siparisNo: string;
  restoranAdi: string;
  /** Kuryenin alacağı ücret (TL). */
  kazanc: number;
  /** Toplam mesafe (km) — alım + teslim. */
  mesafeKm: number;
  alimSemt: string;
  teslimIlce: string;
  kalemSayisi: number;
  /** Teklifin düşeceği an (ISO) — geri sayım bundan çiziliyor. */
  sonGecerlilik: string;
};

/** Müşterinin takip ekranına giden veri. */
export type TakipDto = {
  siparisNo: string;
  durum: SiparisDurumu;
  /** Kurye atanmış ve yoldaysa dolu; aksi hâlde null. */
  kurye: { ad: string; konum: KonumDto | null } | null;
  /** Teslimat adresi — haritada hedef işareti. */
  hedef: { enlem: number; boylam: number } | null;
  /** Dakika cinsinden tahmini varış; hesaplanamıyorsa null. */
  tahminiVarisDk: number | null;
};
