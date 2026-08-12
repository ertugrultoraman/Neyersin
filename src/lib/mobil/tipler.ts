import type { Rol } from "../hesaplar";
import type { SiparisDurumu, Tutarlar } from "../siparis";

/**
 * MOBİL API SÖZLEŞMESİ — sunucu ile iki uygulamanın ortak dili.
 *
 * Bu dosya YALNIZCA tip içeriyor; çalışma zamanı kodu yok. Sebebi, aynı
 * tanımların `mobil/packages/ortak/src/tipler.ts` içinde birebir aynadan
 * yansıtılıyor olması — mobil taraf Next.js kaynak ağacını import edemiyor
 * (farklı derleyici, farklı çalışma alanı). İki dosya elle eşit tutuluyor;
 * biri değişirse diğeri de değişmeli.
 *
 * DOMAIN TİPLERİ YENİDEN YAZILMIYOR: `SiparisDurumu` ve `Tutarlar` doğrudan
 * `lib/siparis`ten alınıyor. Sipariş durumlarının kopyalanmış bir listesi,
 * akışa yeni bir adım eklendiğinde sessizce eskir.
 */

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
