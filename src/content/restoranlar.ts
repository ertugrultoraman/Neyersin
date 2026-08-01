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
    sureDk: [25, 35],
    minSepet: 120,
    teslimatUcreti: 0,
    kampanya: "2 alana 1 bedava kanat",
    etiketler: ["Süper Hızlı"],
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
    sureDk: [30, 45],
    minSepet: 150,
    teslimatUcreti: 0,
    kampanya: "%30 indirim — tüm pizzalarda",
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
    sureDk: [35, 50],
    minSepet: 200,
    teslimatUcreti: 0,
    kampanya: "200 TL üzeri siparişe ayran ikram",
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
    sureDk: [20, 30],
    minSepet: 90,
    teslimatUcreti: 0,
    kampanya: "Günün çorbası 1 TL",
    etiketler: ["En Yüksek Puan", "Süper Hızlı"],
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
    sureDk: [25, 40],
    minSepet: 140,
    teslimatUcreti: 0,
    kampanya: "Menü yükseltme ücretsiz",
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
    sureDk: [15, 25],
    minSepet: 70,
    teslimatUcreti: 0,
    kampanya: "Porsiyon dönere patates ikram",
    etiketler: ["Süper Hızlı", "Bütçe Dostu"],
    semt: "Bağcılar",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "tatli-kacamak",
    ad: "Tatlı Kaçamak",
    mutfaklar: ["Tatlı", "Pasta", "Dondurma"],
    puan: 0,
    yorum: 0,
    sureDk: [30, 45],
    minSepet: 110,
    teslimatUcreti: 0,
    kampanya: "İkinci dilim yarı fiyat",
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
    sureDk: [15, 25],
    minSepet: 60,
    teslimatUcreti: 0,
    etiketler: ["Süper Hızlı", "Sabah Servisi"],
    semt: "Beyoğlu",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "deniz-kenari",
    ad: "Deniz Kenarı",
    mutfaklar: ["Balık", "Meze", "Deniz Ürünleri"],
    puan: 0,
    yorum: 0,
    sureDk: [40, 60],
    minSepet: 250,
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
    sureDk: [20, 30],
    minSepet: 100,
    teslimatUcreti: 0,
    kampanya: "İlk siparişte %25 indirim",
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
    sureDk: [20, 35],
    minSepet: 80,
    teslimatUcreti: 0,
    kampanya: "6 alana 1 bedava",
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
    sureDk: [25, 40],
    minSepet: 95,
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
    sureDk: [35, 50],
    minSepet: 180,
    teslimatUcreti: 0,
    kampanya: "Ana yemeğe pilav ikram",
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
    sureDk: [15, 25],
    minSepet: 50,
    teslimatUcreti: 0,
    etiketler: ["Süper Hızlı", "Sabah Servisi", "Bütçe Dostu"],
    semt: "Kartal",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "gece-lezzetleri",
    ad: "Gece Lezzetleri",
    mutfaklar: ["Fast Food", "Tost", "Çorba"],
    puan: 0,
    yorum: 0,
    sureDk: [20, 35],
    minSepet: 75,
    teslimatUcreti: 0,
    kampanya: "00.00 sonrası %20 indirim",
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
    sureDk: [10, 20],
    minSepet: 60,
    teslimatUcreti: 0,
    kampanya: "İki alana bir bedava atıştırmalık",
    etiketler: ["Süper Hızlı"],
    semt: "Pendik",
    teslimat: TESLIMAT_BOLGESI,
  },
  {
    slug: "makbule-sef",
    ad: "Makbule Şef",
    mutfaklar: ["Ev Yemekleri", "Ev Yapımı"],
    puan: 0,
    yorum: 0,
    sureDk: [45, 70],
    minSepet: 100,
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
    sureDk: [45, 70],
    minSepet: 100,
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
 * "4.5 ve üzeri" filtresi kaldırıldı: puanlar gerçek yorumdan geliyor ve henüz
 * yorum yok, dolayısıyla o filtre her zaman boş liste döndürüyordu. Yerine
 * anasayfadaki seçim ekranıyla eşleşen "Şeflerin Elinden / İşletmeler" geldi.
 */
export const hizliFiltreler = [
  { etiket: "Tümü", test: () => true },
  { etiket: "Şeflerin Elinden", test: (r: Restoran) => sefMutfagiMi(r) },
  { etiket: "İşletmeler", test: (r: Restoran) => !sefMutfagiMi(r) },
  { etiket: "Süper Hızlı", test: (r: Restoran) => r.sureDk[0] <= 20 },
  { etiket: "Kampanyalı", test: (r: Restoran) => Boolean(r.kampanya) },
  { etiket: "Yeni", test: (r: Restoran) => r.etiketler.includes("Yeni") },
] as const;

/** `?tur=` parametresinden filtre sırasını bulur (anasayfadaki seçim ekranı kullanıyor). */
export function filtreSirasi(tur: string | undefined): number {
  if (tur === "sef") return 1;
  if (tur === "isletme") return 2;
  return 0;
}

/**
 * Sıralamalar.
 *
 * "Puan" sıralaması kaldırıldı (tüm puanlar 0) ve "Önerilen" artık puana
 * dayanmıyor. Eski hâli `puan * log10(yorum)` hesaplıyordu; yorum 0 olunca
 * log10(0) = -Infinity üretip sıralamayı NaN'a çeviriyordu.
 */
export const siralamalar = [
  {
    etiket: "Önerilen",
    // Ev mutfakları önce (platformun asıl işi), sonra hızlı hazırlayan.
    uygula: (a: Restoran, b: Restoran) =>
      Number(sefMutfagiMi(b)) - Number(sefMutfagiMi(a)) || a.sureDk[0] - b.sureDk[0],
  },
  { etiket: "Teslimat süresi", uygula: (a: Restoran, b: Restoran) => a.sureDk[0] - b.sureDk[0] },
  { etiket: "Min. sepet", uygula: (a: Restoran, b: Restoran) => a.minSepet - b.minSepet },
] as const;
