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
 * Hesap
 * ----------------------------------------------------------------------- */

export type KayitGirdisi = {
  ad: string;
  eposta: string;
  parola: string;
  telefon?: string;
  /**
   * Sızmış parola uyarısını gördüm, yine de devam.
   *
   * Uyarı bir ENGEL değil: sıkı engelleme insanları kayıttan vazgeçiriyor ve
   * ihlal listesi dış bir servisin verisi, yanlış eşleşme olabilir. Kullanıcı
   * uyarıyı görüp ısrar ederse hesap açılıyor.
   */
  parolayiKabulEt?: boolean;
};

export type KayitSonucu =
  | {
      /** Hesap AÇILMADI; önce parola uyarısı gösterilecek. */
      asama: "parola-uyarisi";
      uyari: string;
    }
  | {
      /** Hesap açıldı, e-postaya kod gitti. Sıradaki adım `/hesap/dogrula`. */
      asama: "kod";
      eposta: string;
      /** Posta gönderilemediyse uygulama kullanıcıyı kod ekranında boşuna bekletmiyor. */
      postaGitmedi: boolean;
    };

export type DogrulamaGirdisi = {
  eposta: string;
  kod: string;
  /** Doğrulama başarılıysa oturum da açılıyor; cihaz kimliği bunun için. */
  cihaz: string;
};

export type KodTekrarGirdisi = { eposta: string; amac: "kayit" | "sifre" };

export type ParolaSifirlamaGirdisi = {
  eposta: string;
  kod: string;
  yeniParola: string;
  yeniParolaTekrar: string;
};

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

/**
 * Ürüne eklenebilen seçenek: ekstra malzeme ya da içecek.
 *
 * Fiyat BURADAN gösteriliyor ama sipariş anında yeniden okunuyor: uygulama
 * yalnızca seçilen ekstranın kimliğini gönderiyor (bkz. SepetGirdisi), adı ve
 * fiyatı sunucudaki ürün tanımından geliyor. Aksi hâlde "0 TL ekstra peynir"
 * göndermek mümkün olurdu.
 */
export type EkstraDto = {
  id: string;
  ad: string;
  fiyat: number;
  /** "icecek" olanlar arayüzde ayrı bir başlık altında toplanıyor. */
  tur?: "icecek";
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
  ekstralar?: EkstraDto[];
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

/** Ayna: src/content/kategoriler.ts → KategoriIkonAdi */
export type KategoriIkonAdi =
  | "burger"
  | "pizza"
  | "doner"
  | "tavuk"
  | "kebap"
  | "ev-yemegi"
  | "tatli"
  | "kahve"
  | "borek"
  | "balik"
  | "vegan"
  | "market";

export type KategoriDto = {
  slug: string;
  ad: string;
  /**
   * İkon ADI — görsel adresi değil.
   *
   * Kategori ikonları vektör ve içinde bulundukları rayın rengine göre
   * boyanıyor; sunucudan bir PNG adresi göndermek hem ağa gereksiz istek
   * ekler hem de koyu/açık zeminde yanlış renkte kalırdı. Uygulama bu adı
   * kendi çizim setinden karşılıyor — web'in yaptığının aynısı.
   */
  ikon: KategoriIkonAdi;
  /** Bu kategoride sipariş alan mutfak sayısı; 0 ise uygulama "yakında" yazıyor. */
  adet: number;
};

/* --------------------------------------------------------------------------
 * Sepet
 * ----------------------------------------------------------------------- */

/**
 * Uygulamanın sunduğu sepet: yalnızca NE ve KAÇ TANE.
 *
 * FİYAT GÖNDERİLMİYOR. Uygulama sepeti cihazda tutuyor ama tutarı hiç
 * hesaplamıyor; ürün fiyatı, teslimat ücreti, kupon indirimi ve minimum sepet
 * kuralı sunucudan geliyor. Fiyat istemciden alınsaydı ödenecek tutar
 * kullanıcının değiştirebildiği bir sayıya bağlı olurdu — ayrıca mutfak
 * fiyatını sepet açıkken güncellediğinde iki taraf ayrışırdı.
 */
export type SepetGirdisi = {
  restoranSlug: string;
  kalemler: { urunId: string; adet: number; ekstraIdler?: string[] }[];
  kuponKodu?: string;
};

export type SepetOzetiDto = {
  /** Sunucunun çözdüğü kalemler — güncel ad ve fiyatlarla. */
  kalemler: SiparisKalemDto[];
  tutarlar: Tutarlar;
  /**
   * Artık satılmayan ürünlerin kimlikleri. Uygulama bunları sepetten düşürüp
   * kullanıcıya söylüyor: sessizce atılsaydı kişi sepete koyduğu şeyin neden
   * kaybolduğunu anlamazdı.
   */
  dusenKalemler: string[];
  /** Kupon reddedildiyse sebebi; kabul edildiyse yok. */
  kuponHatasi?: string;
};

/* --------------------------------------------------------------------------
 * Sipariş
 * ----------------------------------------------------------------------- */

/** Ayna: src/content/odeme.ts → OdemeYontemi */
export type OdemeYontemi = "havale" | "iyzico";

/**
 * Sipariş oluşturma girdisi.
 *
 * Sepetle aynı ilke: fiyat YOK. E-posta da yok — sunucu onu Bearer jetonundan
 * okuyor. Formdaki adrese güvenmek, kişi başı kupon sınırını başka bir adres
 * yazarak aşmayı ve siparişi başkasının hesabına düşürmeyi mümkün kılardı.
 */
export type SiparisOlusturGirdisi = {
  restoranSlug: string;
  kalemler: { urunId: string; adet: number; ekstraIdler?: string[] }[];
  musteri: { adSoyad: string; telefon: string };
  adres: {
    ilce: string;
    mahalle: string;
    acikAdres: string;
    binaNo: string;
    daireNo: string;
    tarif: string;
  };
  not?: string;
  kuponKodu?: string;
  odemeYontemi: OdemeYontemi;
};

export type SiparisOlusturSonucu = {
  siparisNo: string;
  /**
   * Kart ödemesi seçildiyse iyzico'nun ödeme sayfası. Uygulama bunu tarayıcı
   * katmanında açıyor — kart bilgisi uygulamanın kendi ekranına HİÇ girmiyor,
   * böylece PCI kapsamı iyzico'da kalıyor.
   *
   * Kapıda ödemede yok; sipariş doğrudan oluşuyor.
   */
  odemeUrl?: string;
};

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

/**
 * Kuryeye atanmış bir teslimat.
 *
 * ATAMA TABANLI, teklif tabanlı DEĞİL: siparişi kuryeye yönetici atıyor
 * (bkz. admin/yonetim-actions → atananKurye) ve kurye yalnızca kendi
 * atamalarını görüyor. Otomatik dağıtım — "yakındaki kuryelere teklif düşür,
 * ilk kabul eden alsın" — henüz hiçbir yerde yok; uygulamada teklif ekranı
 * yapmak, sunucuda karşılığı olmayan bir akışı varmış gibi göstermek olurdu.
 *
 * ALIM BİLGİLERİ YALNIZCA BURADA. Ev hanımları kendi evlerinden pişiriyor;
 * alım adresi ve telefonu müşteriye hiçbir ekranda gösterilmiyor (bkz.
 * SefProfili.alimAdresi). Bu DTO yalnızca siparişe atanmış kuryeye ve
 * yöneticiye dönüyor.
 */
export type KuryeTeslimatiDto = {
  siparisNo: string;
  durum: SiparisDurumu;
  restoranAdi: string;
  restoranSlug: string;
  /** Mutfaktan alım — kurye buraya gidiyor. */
  alim: { adres?: string; telefon?: string; semt: string };
  /** Müşteriye teslim. */
  teslim: {
    adSoyad: string;
    telefon: string;
    ilce: string;
    mahalle: string;
    acikAdres: string;
    binaNo: string;
    daireNo: string;
    tarif: string;
  };
  kalemSayisi: number;
  /** Kapıda ödemede kuryenin tahsil edeceği tutar; kartla ödendiyse 0. */
  tahsilat: number;
  not: string;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
};

/** Kuryenin bir teslimatta atabileceği adımlar. */
export type KuryeAdimGirdisi = { hedef: "yolda" | "teslim-edildi" };

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
