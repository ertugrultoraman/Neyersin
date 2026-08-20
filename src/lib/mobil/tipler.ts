import type { KategoriIkonAdi } from "@/content/kategoriler";
import type { OdemeYontemi } from "@/content/odeme";
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

/**
 * ŞEF / EV HANIMI / KURYE / İŞLETME BAŞVURUSU — web'deki /hesap/basvuru formu.
 *
 * PAROLA BAŞVURUDA BELİRLENİYOR: yönetici onayladığı anda hesap bu parolayla
 * açılıyor, kişi ayrıca kayıt olmuyor. Onaydan sonra ikinci bir form istemek,
 * kabul edilmiş bir başvurunun yarısını havada bırakırdı.
 */
export type BasvuruGirdisi = {
  ad: string;
  telefon: string;
  eposta: string;
  parola: string;
  /** Sunucudaki BASVURU_TURLERI ile aynı dört değer. */
  tur: BasvuruTuruDegeri;
  /** Kişinin kendini tanıttığı metin — sunucuda da en az 30 karakter isteniyor. */
  mesaj: string;
};

export type BasvuruTuruDegeri = "sef" | "ev-hanimi" | "kurye" | "isletme";

/** Başvuru formunda gösterilen seçenek — etiket ve açıklama sunucudan geliyor. */
export type BasvuruTuruDto = {
  deger: BasvuruTuruDegeri;
  etiket: string;
  aciklama: string;
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

/**
 * Müşterinin yazdığı değerlendirme — web'deki yorum kartının aynısı.
 *
 * E-POSTA GÖNDERİLMİYOR: yorum herkese açık, yazan kişinin adresi değil.
 * Web tarafı da yalnızca adı gösteriyor (bkz. components/restoran/Yorumlar).
 */
export type YorumDto = {
  id: string;
  musteriAdi: string;
  /** 1–5 arası üç eksen; ekranda ortalaması yıldız olarak çiziliyor. */
  sicaklik: number;
  teslimatHizi: number;
  tad: number;
  metin?: string;
  /** Mutfağın yoruma verdiği cevap — tek yönlü değerlendirme adil değil. */
  yanit?: string;
  /** ISO 8601. Biçimlendirme ekranın işi; sunucu ham tarihi gönderiyor. */
  tarih: string;
};

export type RestoranDetayDto = RestoranOzetDto & {
  hikaye?: string;
  uzmanlik?: string;
  slogan?: string;
  sertifikalar?: string;
  /**
   * ŞEFİ KİŞİSELLEŞTİREN ALANLAR — web'deki mutfak sayfasının aynısı
   * (bkz. lib/hesaplar/tipler.ts → SefProfili).
   *
   * Hepsi isteğe bağlı ve boşsa ekranda hiç çizilmiyorlar: eksik bir alan
   * için "belirtilmemiş" yazmak, profili doldurulmuş gibi göstermekten
   * daha kötü bir izlenim bırakıyor.
   */
  deneyimYili?: number;
  memleket?: string;
  imzaYemegi?: string;
  /** Şefin kendi mutfağından kareler (en fazla 6 adres). */
  galeri?: string[];
  teslimatBolgeleri: string[];
  menu: MenuBolumuDto[];
  yorumOzeti: { adet: number; ortalama: number; sicaklik: number; teslimatHizi: number; tad: number };
  /**
   * YORUMLARIN KENDİSİ, özetin yanında.
   *
   * Özet tek başına "4,7 · 12 değerlendirme" diyor; müşterinin okumak
   * istediği ise cümleler. Web sayfası ikisini birden gösteriyor, uygulama
   * da göstersin diye detay cevabına konuldu — ayrı bir uç, ikinci bir
   * gidiş-geliş demek olurdu.
   */
  yorumlar: YorumDto[];
};

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
 * Ana sayfa (Keşfet)
 * ----------------------------------------------------------------------- */

/**
 * Kampanya kartı — web'deki kampanya ızgarasının aynısı
 * (bkz. content/kampanyalar.ts).
 *
 * KUPON KODU BURADAN GELİYOR ama indirim BURADA HESAPLANMIYOR: uygulama kodu
 * yalnızca gösteriyor, tutarı sunucu sepet özetinde hesaplıyor. İndirim
 * değeri cevaba konsaydı, kuponun koşulları (minimum sepet, ilk sipariş,
 * kişi başı tek kullanım) iki yerde ayrı ayrı yorumlanırdı.
 */
export type KampanyaDto = {
  slug: string;
  baslik: string;
  aciklama: string;
  vurgu: string;
  ton: "sari" | "kahve" | "domates" | "nane";
  kod?: string;
  /** "cumartesi ve pazar günleri" gibi; her gün geçerliyse alan yok. */
  gunler?: string;
  /**
   * Bugün kullanılabilir mi.
   *
   * Gün hesabı SUNUCUDA yapılıyor ve her zaman İstanbul saatine göre: telefonun
   * saat dilimi değiştirilerek cumartesi kuponu salı günü açılamasın.
   */
  bugunGecerli: boolean;
};

/** "Nasıl çalışır" adımı — dört adımın her biri. */
export type AdimDto = { baslik: string; metin: string };

/** Sıkça sorulan soru. */
export type SoruCevapDto = { soru: string; cevap: string };

export type AnketSecenegiDto = { id: string; etiket: string; oy: number };

/**
 * Ana sayfadaki anket — yöneticinin panelden yayınladığı tek soru.
 *
 * `oyVerdim` cevaba KONMUYOR: uç girişsiz açılıyor ve misafirin oyu tarayıcı
 * biletine bağlı. Uygulama kendi oyunu cihazda hatırlıyor; sunucu yalnızca
 * sayıları söylüyor.
 */
export type AnketDto = {
  id: string;
  soru: string;
  secenekler: AnketSecenegiDto[];
  toplamOy: number;
};

/**
 * KEŞFET EKRANININ ÜST BÖLÜMÜ — web ana sayfasının uygulamadaki karşılığı.
 *
 * TEK UÇ: kampanyalar, öne çıkanlar, ayın hanımları, adımlar ve anket ayrı
 * uçlara bölünseydi açılış ekranı beş ayrı isteğin en yavaşını beklerdi.
 * Hepsi aynı anda çiziliyor; aynı anda gelsinler.
 *
 * Mutfak listesinin KENDİSİ burada değil: o süzgeçlerle (kategori, arama)
 * değişiyor ve kendi ucundan geliyor.
 */
export type AnasayfaDto = {
  istatistik: {
    mutfakSayisi: number;
    /** Katalogdaki mutfakların puan ortalaması. */
    ortalamaPuan: number;
    /** "25-40 dk" — web'deki söz verilen aralığın aynısı. */
    teslimatSuresi: string;
  };
  kampanyalar: KampanyaDto[];
  oneCikanlar: RestoranOzetDto[];
  /** Evinde pişiren şefler — web'deki "Ayın Hanımları" bölümü. */
  ayinHanimlari: RestoranOzetDto[];
  nasilCalisir: AdimDto[];
  sss: SoruCevapDto[];
  anket: AnketDto | null;
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
 * LİSTEYE YALNIZCA KABUL EDİLMİŞ İŞ GİRİYOR. Teklif iki yoldan geliyor:
 * havuzdan (çevrimiçi herkese) ya da yöneticinin tek kuryeye yönlendirmesiyle
 * (bkz. admin/yonetim-actions → teklifEdilenKurye). İkisi de aynı yerde
 * bitiyor — kurye "Kabul et" diyor ve sipariş bu listeye düşüyor. Elle atama
 * eskiden doğrudan buraya yazıyordu; iş, kurye onaylamadan üstüne biniyordu.
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

/**
 * Kuryenin aracı.
 *
 * Ayna: components/iletisim/IletisimFormu.tsx → ARACLAR. Başvuru formundaki
 * listeyle aynı olmak zorunda: kişi motosikletle başvurup uygulamada
 * "bisiklet" seçebilseydi, ehliyet denetimi anlamını yitirirdi.
 */
export type AracTuru = "motosiklet" | "moped" | "otomobil" | "scooter" | "bisiklet";

/**
 * Kuryenin müsaitlik durumu.
 *
 * ÇEVRİMİÇİ OLMAK BİR NİYET BEYANI DEĞİL, ÖLÇÜLEN BİR ŞEY: sunucu bayrağın
 * yanında son görülme damgasına da bakıyor. Uygulamayı kapatan kurye
 * "çevrimdışıyım" diyemeden gidiyor ve teklifler ona düşmeye devam ederdi.
 */
export type KuryeDurumuDto = {
  cevrimici: boolean;
  arac: AracTuru | null;
  konum: KonumDto | null;
};

export type DurumGirdisi = { cevrimici: boolean; arac?: AracTuru };

export type KonumGirdisi = {
  enlem: number;
  boylam: number;
  dogruluk?: number;
  yon?: number;
  hiz?: number;
};

/**
 * Teslimat başına hakedişin kalemleri.
 *
 * Hakediş SİPARİŞ TUTARININ YÜZDESİ (bkz. lib/kurye-tarife.ts): kademeye göre
 * %25, %18 ya da %15. Döküm gönderiliyor çünkü yalnızca toplam yazsaydı kurye
 * neden bir işten 60, diğerinden 95 TL aldığını anlayamazdı — oran ve taban
 * görünmeden tutar keyfî görünüyor.
 *
 * KUPON KESİNTİSİ AYRI SATIR: kupon bedeli kurye, satıcı ve platform arasında
 * eşit bölünüyor. Kesinti gizlenip yalnızca düşük toplam gösterilseydi, kurye
 * kuponlu siparişlerde kazancının neden düştüğünü göremez ve hesabın yanlış
 * olduğunu düşünürdü.
 */
export type UcretDokumuDto = {
  /** Komisyonun hesaplandığı tutar: ürün ara toplamı + teslimat, indirim öncesi. */
  siparisTutari: number;
  /** Bu kademede kuryeye düşen yüzde (ör. 25). */
  yuzde: number;
  /** Kupon varsa kuryenin payına düşen kesinti; yoksa 0. */
  kuponKesintisi: number;
  /** Kuryenin bu teslimattan eline geçen net tutar. */
  toplam: number;
};

/**
 * Kuryeye düşen iş teklifi.
 *
 * MÜŞTERİNİN AÇIK ADRESİ VE TELEFONU YOK — yalnızca ilçe ve mahalle. Kurye
 * işi kabul etmeden kapı numarasını görmemeli; teklif ekranı, kabul etmeden
 * adres toplamanın en kolay yolu olurdu.
 *
 * `kalanSaniye` SUNUCUDAN geliyor: telefonun saati yanlış kurulmuş olabilir
 * ve geri sayım `sonGecerlilik` üzerinden hesaplansaydı teklif kimi cihazda
 * hiç bitmez, kiminde anında biterdi.
 */
export type TeklifDto = {
  siparisNo: string;
  restoranAdi: string;
  alimSemti: string;
  teslimIlcesi: string;
  teslimMahallesi: string;
  kalemSayisi: number;
  tahsilat: number;
  /**
   * Mutfaktan teslim adresine YAKLAŞIK yol (km).
   *
   * Mahalle merkezinden hesaplanıyor, kapı koordinatı yok (bkz. lib/mesafe).
   * Bu yüzden ekranda "~" ile yazılıyor. Hesaplanamadıysa `null` — uydurma
   * bir sayı yerine hiçbir şey göstermek doğru: kurye buna bakarak iş seçiyor.
   */
  mesafeKm: number | null;
  ucret: UcretDokumuDto;
  olusturmaTarihi: string;
  sonGecerlilik: string;
  kalanSaniye: number;
};

/** Bir dönemin teslimat sayısı, hakedişi ve toplanan nakdi. */
export type KuryeDonemDto = { teslimat: number; kazanc: number; tahsilat: number };

/**
 * Kurye özet ekranının tamamı.
 *
 * Kabul oranı sunucuda hesaplanıyor: uygulamada hesaplansaydı yalnızca o
 * cihazın gördüğü teklifler sayılırdı ve kurye telefon değiştirdiğinde oran
 * sıfırlanırdı.
 */
export type KuryeOzetiDto = {
  bugun: KuryeDonemDto;
  hafta: KuryeDonemDto;
  /** Bugüne kadarki tüm teslimatlar — kuryenin "toplamda ne yaptım" sorusu. */
  toplam: KuryeDonemDto;
  acikTeslimat: number;
  kabulOrani: { yuzde: number | null; kabul: number; toplam: number };
  cevrimici: boolean;
};

/**
 * Bir vardiya dilimi — önceden yer ayrılabilen çalışma aralığı.
 *
 * DOLULUK GÖSTERİLİYOR (`dolu`/`kontenjan`): yalnızca "yer var/yok" dönseydi
 * kurye son iki yeri gördüğünde acele etmesi gerektiğini bilemezdi.
 *
 * KARAR ALANLARI SUNUCUDA hesaplanıyor (`rezerveEdilebilir`, `iptalEdilebilir`).
 * Uygulama saatleri kendi saatiyle karşılaştırsaydı, saati şaşmış bir telefon
 * çoktan başlamış vardiyaya "yer ayır" düğmesi gösterir, kurye de reddedilen
 * bir isteğe bakardı.
 */
export type VardiyaDilimiDto = {
  id: string;
  baslangic: string;
  bitis: string;
  /** "Kadıköy", "Avrupa yakası" gibi serbest metin; boş olabilir. */
  bolge: string;
  not: string;
  kontenjan: number;
  dolu: number;
  benim: boolean;
  rezerveEdilebilir: boolean;
  iptalEdilebilir: boolean;
};

/**
 * Kurye vardiya ekranının tamamı.
 *
 * `siradaki` ŞU AN SÜREN vardiyayı da kapsıyor: bitmemiş her dilim listeye
 * giriyor. Yalnızca gelecektekiler alınsaydı kurye, vardiyasının ortasında
 * "planlanmış vardiyan yok" yazısını görürdü.
 */
export type VardiyaPlaniDto = {
  siradaki: VardiyaDilimiDto | null;
  rezervasyonlarim: VardiyaDilimiDto[];
  acikDilimler: VardiyaDilimiDto[];
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

/* ------------------------------------------------------------------------ *
 * DESTEK — kuryenin yetkiliye ulaşma yolu
 * ------------------------------------------------------------------------ */

/**
 * Kuryenin açtığı destek talebi ve yöneticinin yanıtı.
 *
 * TEK SORU + TEK YANIT, sohbet değil. Kurye motorda; sürekli yazışacak
 * durumda değil ve acil olan her şey için telefon var (bkz. DestekDto →
 * telefon). Buradaki yazışma "acil değil ama kayda geçsin" işleri için:
 * eksik hakediş, yanlış adres, uygulamada takılan bir ekran.
 */
export type DestekTalebiDto = {
  no: string;
  konu: string;
  mesaj: string;
  durum: "acik" | "cozuldu";
  /** Yönetici henüz yazmadıysa null. */
  yanit: string | null;
  olusturmaTarihi: string;
  guncellemeTarihi: string;
};

/**
 * Destek ekranının tamamı.
 *
 * TELEFON SUNUCUDAN GELİYOR, uygulamaya gömülü değil: numara değiştiğinde
 * mağaza güncellemesi beklemek, kuryeyi çalmayan bir numarayla baş başa
 * bırakırdı.
 */
export type DestekDto = {
  telefon: string;
  talepler: DestekTalebiDto[];
};

/** Yeni talep gövdesi. */
export type DestekGirdisi = {
  konu: string;
  mesaj: string;
  /** İlgili sipariş — kurye teslimat ekranından açtıysa dolu. */
  siparisNo?: string;
};
