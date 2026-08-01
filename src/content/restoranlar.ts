export type Restoran = {
  slug: string;
  ad: string;
  mutfaklar: string[];
  /**
   * Ortalama puan ve yorum sayısı.
   *
   * HEPSİ 0 — ve öyle kalmalı. Burada bir zamanlar "4,8 puan / 5.127 yorum"
   * gibi uydurma rakamlar duruyordu; platformun henüz tek bir tamamlanmış
   * siparişi yokken bu hem yanıltıcıydı hem de arama motorlarına sahte
   * AggregateRating göndermek demekti. Gerçek yorumlar `yorumlar` tablosundan
   * gelir (bkz. lib/hesaplar). Puanı olmayan mutfak "Henüz değerlendirilmedi"
   * gösterir — sıfır yıldız değil.
   */
  puan: number;
  yorum: number;
  /** [en hızlı, en yavaş] tahmini teslimat süresi, dakika. */
  sureDk: [number, number];
  minSepet: number;
  /** 0 → teslimat ücretsiz */
  teslimatUcreti: number;
  /**
   * Restorana özel kampanya metni.
   *
   * ŞU AN HİÇBİRİNDE YOK ve öyle kalmalı. Burada bir zamanlar "2 alana 1 bedava
   * kanat", "günün çorbası 1 TL" gibi 12 kampanya yazıyordu; hiçbiri işletmeyle
   * konuşulmamıştı. Kampanya bir maliyet taahhüdüdür — kâr/zarar hesabı yapılıp
   * karar verilmeden buraya yazılmaz.
   */
  kampanya?: string;
  etiketler: string[];
  /** Restoranın bulunduğu İstanbul ilçesi. */
  semt: string;
  /** Teslimat yaptığı ilçeler — adres seçimi bu listeye göre filtreler. */
  teslimat: string[];
  oneCikan?: boolean;
  /**
   * Kendi mutfağından satan bireysel profil mi? Şef paneli ve profil sayfası
   * bu alana bakar — `etiketler` içindeki "Ev Yapımı" bir ÜRÜN etiketidir
   * (ör. pastanenin ev yapımı kekleri) ve bireysel profil anlamına gelmez.
   */
  evSefi?: boolean;
  /**
   * Bireysel profilin kategorisi. Kayıt ekranında "Şef" ve "Ev Hanımı" sekmeleri
   * bu alana göre ayrılır; "Ayın Hanımları" bölümü yalnızca ev hanımlarını gösterir.
   */
  sefTuru?: "sef" | "ev-hanimi";
  /**
   * Ev şefi/aşçısı profili — kendi biyografisini ve sertifikalarını yazabildiği
   * serbest metin alanı. Yoksa restoran sayfasında bu bölüm hiç gösterilmez.
   */
  sefBiyografisi?: string;
};

/**
 * ŞU ANKİ HİZMET ALANI — yalnızca Beylikdüzü.
 *
 * Platform şimdilik tek ilçede çalışıyor; bu yüzden bütün restoranlar aynı
 * bölgeye teslimat yapar. Yeni ilçe açıldığında tek yapılacak şey bu diziye
 * ilçeyi eklemek; adres seçimi ve "teslimat yok" uyarısı buradan türüyor.
 */
export const TESLIMAT_BOLGESI = ["Beylikdüzü"];

/**
 * Minimum sepet tutarı — TÜM mutfaklarda aynı.
 *
 * Tek bir sabitten okunuyor; restoran başına elle girilen farklı limitler
 * hem müşteri için kafa karıştırıcıydı hem de değiştirmek için 18 satırı tek
 * tek düzenlemek gerekiyordu. Yeni açılan şef mutfakları da bunu kullanır
 * (bkz. lib/restoran-listesi.ts).
 */
export const MIN_SEPET = 200;

/**
 * Tahmini teslimat süresi — TÜM mutfaklarda aynı: 25–45 dakika.
 *
 * Tek sabitten okunuyor. Restoran başına farklı süreler yazmak, gerçek bir
 * ölçüm olmadığı hâlde "bu mutfak daha hızlı" izlenimi veriyordu; sipariş
 * biriktikçe gerçek süreler ölçülüp buraya bağlanabilir.
 */
export const TESLIMAT_SURESI: [number, number] = [25, 45];

/**
 * Genişleme planındaki bölge tanımları — aynı yakada, komşu ilçeler, boğaz
 * geçişi yok. Şu an kullanılmıyor; ilçe ilçe açılırken restoranların
 * `teslimat` alanına tekrar bağlanacak.
 */
export const AVRUPA_MERKEZ = [
  "Beşiktaş",
  "Şişli",
  "Kağıthane",
  "Beyoğlu",
  "Sarıyer",
  "Eyüpsultan",
  "Fatih",
  "Gaziosmanpaşa",
];
export const AVRUPA_BATI = [
  "Bakırköy",
  "Bahçelievler",
  "Küçükçekmece",
  "Avcılar",
  "Esenyurt",
  "Beylikdüzü",
  "Başakşehir",
  "Zeytinburnu",
  "Güngören",
  "Büyükçekmece",
];
export const AVRUPA_ICBATI = [
  "Bağcılar",
  "Güngören",
  "Esenler",
  "Bahçelievler",
  "Küçükçekmece",
  "Bayrampaşa",
  "Başakşehir",
  "Sultangazi",
  "Arnavutköy",
];
export const ANADOLU_MERKEZ = [
  "Kadıköy",
  "Ataşehir",
  "Üsküdar",
  "Maltepe",
  "Ümraniye",
  "Kartal",
  "Sancaktepe",
  "Çekmeköy",
  "Beykoz",
];
export const ANADOLU_DOGU = [
  "Pendik",
  "Kartal",
  "Tuzla",
  "Sultanbeyli",
  "Sancaktepe",
  "Çekmeköy",
  "Maltepe",
  "Şile",
  "Adalar",
];

export const restoranlar: Restoran[] = [
  {
    slug: "ates-kanat",
    ad: "Ateş Kanat",
    mutfaklar: ["Tavuk", "Kanat", "Fast Food"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Popüler"],
    semt: "Kadıköy",
    teslimat: TESLIMAT_BOLGESI,
    oneCikan: true,
  },
  {
    slug: "kirmizi-firin",
    ad: "Kırmızı Fırın",
    mutfaklar: ["Pizza", "İtalyan"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Editörün Seçimi"],
    semt: "Beşiktaş",
    teslimat: TESLIMAT_BOLGESI,
    oneCikan: true,
  },
  {
    slug: "sef-mangal",
    ad: "Şef Mangal",
    mutfaklar: ["Kebap", "Izgara", "Meze"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Odun Ateşi"],
    semt: "Ataşehir",
    teslimat: TESLIMAT_BOLGESI,
    oneCikan: true,
  },
  {
    slug: "anne-sofrasi",
    ad: "Anne Sofrası",
    mutfaklar: ["Ev Yemekleri", "Çorba", "Türk Mutfağı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["En Yüksek Puan"],
    semt: "Üsküdar",
    teslimat: TESLIMAT_BOLGESI,
    oneCikan: true,
  },
  {
    slug: "burger-atolyesi",
    ad: "Burger Atölyesi",
    mutfaklar: ["Burger", "Fast Food"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Yeni"],
    semt: "Şişli",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "doner-vadisi",
    ad: "Döner Vadisi",
    mutfaklar: ["Döner", "Dürüm"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Bütçe Dostu"],
    semt: "Bağcılar",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "tatli-kacamak",
    ad: "Tatlı Kaçamak",
    mutfaklar: ["Tatlı", "Pasta", "Dondurma"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Ev Yapımı"],
    semt: "Bakırköy",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "cekirdek-kahve",
    ad: "Çekirdek Kahve",
    mutfaklar: ["Kahve", "Sandviç", "Kahvaltı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Sabah Servisi"],
    semt: "Beyoğlu",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "deniz-kenari",
    ad: "Deniz Kenarı",
    mutfaklar: ["Balık", "Meze", "Deniz Ürünleri"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Günlük Taze"],
    semt: "Sarıyer",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "yesil-kase",
    ad: "Yeşil Kase",
    mutfaklar: ["Vegan", "Salata", "Sağlıklı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Yeni"],
    semt: "Kağıthane",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "kars-cig-borek",
    ad: "Kars Çiğ Börek",
    mutfaklar: ["Çiğ Börek", "Hamur İşi"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Bütçe Dostu"],
    semt: "Ümraniye",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "pide-ustasi",
    ad: "Pide Ustası",
    mutfaklar: ["Pide & Lahmacun", "Türk Mutfağı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Taş Fırın"],
    semt: "Fatih",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "baharat-yolu",
    ad: "Baharat Yolu",
    mutfaklar: ["Dünya Mutfağı", "Hint", "Uzak Doğu"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Editörün Seçimi"],
    semt: "Maltepe",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "sabah-simit",
    ad: "Sabah Simit",
    mutfaklar: ["Kahvaltı", "Börek", "Fırın"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Sabah Servisi", "Bütçe Dostu"],
    semt: "Kartal",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "gece-lezzetleri",
    ad: "Gece Lezzetleri",
    mutfaklar: ["Fast Food", "Tost", "Çorba"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Gece Açık"],
    semt: "Zeytinburnu",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "hizli-market",
    ad: "Hızlı Market",
    mutfaklar: ["Market", "Atıştırmalık", "İçecek"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Popüler"],
    semt: "Pendik",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "makbule-sef",
    ad: "Makbule Şef",
    mutfaklar: ["Ev Yemekleri", "Ev Yapımı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Yeni", "Ev Yapımı"],
    semt: "Beylikdüzü",
    teslimat: TESLIMAT_BOLGESI,
    evSefi: true,
    sefTuru: "ev-hanimi",
  },
  {
    slug: "gonul-sef",
    ad: "Gönül Şef",
    mutfaklar: ["Ev Yemekleri", "Ev Yapımı"],
    puan: 0,
    yorum: 0,
    sureDk: TESLIMAT_SURESI,
    minSepet: MIN_SEPET,
    teslimatUcreti: 0,
    etiketler: ["Yeni", "Ev Yapımı"],
    semt: "Beylikdüzü",
    teslimat: TESLIMAT_BOLGESI,
    evSefi: true,
    sefTuru: "ev-hanimi",
  },
];

export function restoranBul(slug: string): Restoran | undefined {
  return restoranlar.find((r) => r.slug === slug);
}

/** Seçilen ilçeye teslimat yapan restoranlar. İlçe yoksa tümü döner. */
export function ilceyeGoreRestoranlar(ilce: string | null): Restoran[] {
  if (!ilce) return restoranlar;
  return restoranlar.filter((r) => r.teslimat.includes(ilce));
}

/**
 * Gerçekten teslimat yapılan ilçeler — restoran verisinden türetilir.
 * Adres seçimi bunu kullanır; böylece kimse teslimat yapılmayan bir ilçeyi
 * seçip sepetin sonunda "buraya gelmiyoruz" duvarına çarpmaz.
 */
export function teslimatYapilanIlceler(): string[] {
  const kume = new Set<string>();
  for (const r of restoranlar) for (const i of r.teslimat) kume.add(i);
  return [...kume].sort((a, b) => a.localeCompare(b, "tr"));
}

/** Ana sayfadaki filtre şeridinde kullanılan hızlı filtreler. */
/** Bireysel mutfak mı (ev hanımı / şef) yoksa ticari işletme mi? */
export function sefMutfagiMi(r: Restoran): boolean {
  return Boolean(r.evSefi || r.sefTuru);
}

/**
 * Hızlı filtreler.
 *
 * Şef/işletme ayrımı BURADA DEĞİL, sayfanın üstündeki sekmelerde
 * (bkz. components/restoran/TurSekmeleri). İkisini birden koymak iki ayrı
 * kontrolün aynı şeyi yönetmesi demekti: sekme adresi, çip ise yerel durumu
 * değiştirdiği için biri diğerinden habersiz kalıyordu.
 *
 * "4.5 ve üzeri" filtresi de kaldırıldı: puanlar gerçek yorumdan geliyor ve
 * henüz yorum yok, o filtre her zaman boş liste döndürüyordu.
 */
export const hizliFiltreler = [
  { etiket: "Tümü", test: () => true },
  { etiket: "Ev Yapımı", test: (r: Restoran) => r.etiketler.includes("Ev Yapımı") },
  { etiket: "Yeni", test: (r: Restoran) => r.etiketler.includes("Yeni") },
] as const;

/** `?tur=` parametresine göre listeyi ayırır. */
export function tureayir<T extends Restoran>(liste: T[], tur: string | undefined): T[] {
  if (tur === "sef") return liste.filter((r) => sefMutfagiMi(r));
  if (tur === "isletme") return liste.filter((r) => !sefMutfagiMi(r));
  return liste;
}

/**
 * Sıralamalar.
 *
 * "Puan" (tüm puanlar 0), "Teslimat süresi" ve "Min. sepet" (ikisi de artık
 * tüm mutfaklarda aynı) kaldırıldı — hepsi kullanıcıya seçenek gibi görünüp
 * hiçbir şeyi değiştirmiyordu.
 */
export const siralamalar = [
  {
    etiket: "Önerilen",
    // Ev mutfakları önce — platformun asıl işi o.
    uygula: (a: Restoran, b: Restoran) =>
      Number(sefMutfagiMi(b)) - Number(sefMutfagiMi(a)) || a.ad.localeCompare(b.ad, "tr"),
  },
  { etiket: "İsme göre", uygula: (a: Restoran, b: Restoran) => a.ad.localeCompare(b.ad, "tr") },
] as const;
