export type Restoran = {
  slug: string;
  ad: string;
  mutfaklar: string[];
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
   * Kendi mutfağından satan ev şefi mi? "Ayın Hanımları" bölümü ve şef profili
   * bu alana bakar — `etiketler` içindeki "Ev Yapımı" bir ÜRÜN etiketidir
   * (ör. pastanenin ev yapımı kekleri) ve ev şefi anlamına gelmez.
   */
  evSefi?: boolean;
  /**
   * Ev şefi/aşçısı profili — kendi biyografisini ve sertifikalarını yazabildiği
   * serbest metin alanı. Yoksa restoran sayfasında bu bölüm hiç gösterilmez.
   */
  sefBiyografisi?: string;
};

// Teslimat bölgeleri: aynı yakada, komşu ilçeler. Boğaz geçişi yok.
const AVRUPA_MERKEZ = [
  "Beşiktaş",
  "Şişli",
  "Kağıthane",
  "Beyoğlu",
  "Sarıyer",
  "Eyüpsultan",
  "Fatih",
  "Gaziosmanpaşa",
];
const AVRUPA_BATI = [
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
const AVRUPA_ICBATI = [
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
const ANADOLU_MERKEZ = [
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
const ANADOLU_DOGU = [
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
    puan: 4.7,
    yorum: 2841,
    sureDk: [25, 35],
    minSepet: 120,
    teslimatUcreti: 0,
    kampanya: "2 alana 1 bedava kanat",
    etiketler: ["Süper Hızlı"],
    semt: "Kadıköy",
    teslimat: ANADOLU_MERKEZ,
    oneCikan: true,
  },
  {
    slug: "kirmizi-firin",
    ad: "Kırmızı Fırın",
    mutfaklar: ["Pizza", "İtalyan"],
    puan: 4.8,
    yorum: 5127,
    sureDk: [30, 45],
    minSepet: 150,
    teslimatUcreti: 0,
    kampanya: "%30 indirim — tüm pizzalarda",
    etiketler: ["Editörün Seçimi"],
    semt: "Beşiktaş",
    teslimat: AVRUPA_MERKEZ,
    oneCikan: true,
  },
  {
    slug: "sef-mangal",
    ad: "Şef Mangal",
    mutfaklar: ["Kebap", "Izgara", "Meze"],
    puan: 4.6,
    yorum: 3392,
    sureDk: [35, 50],
    minSepet: 200,
    teslimatUcreti: 0,
    kampanya: "200 TL üzeri siparişe ayran ikram",
    etiketler: ["Odun Ateşi"],
    semt: "Ataşehir",
    teslimat: ANADOLU_MERKEZ,
    oneCikan: true,
  },
  {
    slug: "anne-sofrasi",
    ad: "Anne Sofrası",
    mutfaklar: ["Ev Yemekleri", "Çorba", "Türk Mutfağı"],
    puan: 4.9,
    yorum: 6084,
    sureDk: [20, 30],
    minSepet: 90,
    teslimatUcreti: 0,
    kampanya: "Günün çorbası 1 TL",
    etiketler: ["En Yüksek Puan", "Süper Hızlı"],
    semt: "Üsküdar",
    teslimat: ANADOLU_MERKEZ,
    oneCikan: true,
  },
  {
    slug: "burger-atolyesi",
    ad: "Burger Atölyesi",
    mutfaklar: ["Burger", "Fast Food"],
    puan: 4.5,
    yorum: 1978,
    sureDk: [25, 40],
    minSepet: 140,
    teslimatUcreti: 0,
    kampanya: "Menü yükseltme ücretsiz",
    etiketler: ["Yeni"],
    semt: "Şişli",
    teslimat: AVRUPA_MERKEZ,
  },
  {
    slug: "doner-vadisi",
    ad: "Döner Vadisi",
    mutfaklar: ["Döner", "Dürüm"],
    puan: 4.4,
    yorum: 4410,
    sureDk: [15, 25],
    minSepet: 70,
    teslimatUcreti: 0,
    kampanya: "Porsiyon dönere patates ikram",
    etiketler: ["Süper Hızlı", "Bütçe Dostu"],
    semt: "Bağcılar",
    teslimat: AVRUPA_ICBATI,
  },
  {
    slug: "tatli-kacamak",
    ad: "Tatlı Kaçamak",
    mutfaklar: ["Tatlı", "Pasta", "Dondurma"],
    puan: 4.8,
    yorum: 2265,
    sureDk: [30, 45],
    minSepet: 110,
    teslimatUcreti: 0,
    kampanya: "İkinci dilim yarı fiyat",
    etiketler: ["Ev Yapımı"],
    semt: "Bakırköy",
    teslimat: AVRUPA_BATI,
  },
  {
    slug: "cekirdek-kahve",
    ad: "Çekirdek Kahve",
    mutfaklar: ["Kahve", "Sandviç", "Kahvaltı"],
    puan: 4.7,
    yorum: 1542,
    sureDk: [15, 25],
    minSepet: 60,
    teslimatUcreti: 0,
    etiketler: ["Süper Hızlı", "Sabah Servisi"],
    semt: "Beyoğlu",
    teslimat: AVRUPA_MERKEZ,
  },
  {
    slug: "deniz-kenari",
    ad: "Deniz Kenarı",
    mutfaklar: ["Balık", "Meze", "Deniz Ürünleri"],
    puan: 4.6,
    yorum: 987,
    sureDk: [40, 60],
    minSepet: 250,
    teslimatUcreti: 0,
    etiketler: ["Günlük Taze"],
    semt: "Sarıyer",
    teslimat: AVRUPA_MERKEZ,
  },
  {
    slug: "yesil-kase",
    ad: "Yeşil Kase",
    mutfaklar: ["Vegan", "Salata", "Sağlıklı"],
    puan: 4.5,
    yorum: 743,
    sureDk: [20, 30],
    minSepet: 100,
    teslimatUcreti: 0,
    kampanya: "İlk siparişte %25 indirim",
    etiketler: ["Yeni"],
    semt: "Kağıthane",
    teslimat: AVRUPA_MERKEZ,
  },
  {
    slug: "kars-cig-borek",
    ad: "Kars Çiğ Börek",
    mutfaklar: ["Çiğ Börek", "Hamur İşi"],
    puan: 4.7,
    yorum: 3106,
    sureDk: [20, 35],
    minSepet: 80,
    teslimatUcreti: 0,
    kampanya: "6 alana 1 bedava",
    etiketler: ["Bütçe Dostu"],
    semt: "Ümraniye",
    teslimat: ANADOLU_MERKEZ,
  },
  {
    slug: "pide-ustasi",
    ad: "Pide Ustası",
    mutfaklar: ["Pide & Lahmacun", "Türk Mutfağı"],
    puan: 4.4,
    yorum: 2588,
    sureDk: [25, 40],
    minSepet: 95,
    teslimatUcreti: 0,
    etiketler: ["Taş Fırın"],
    semt: "Fatih",
    teslimat: AVRUPA_MERKEZ,
  },
  {
    slug: "baharat-yolu",
    ad: "Baharat Yolu",
    mutfaklar: ["Dünya Mutfağı", "Hint", "Uzak Doğu"],
    puan: 4.6,
    yorum: 1129,
    sureDk: [35, 50],
    minSepet: 180,
    teslimatUcreti: 0,
    kampanya: "Ana yemeğe pilav ikram",
    etiketler: ["Editörün Seçimi"],
    semt: "Maltepe",
    teslimat: ANADOLU_MERKEZ,
  },
  {
    slug: "sabah-simit",
    ad: "Sabah Simit",
    mutfaklar: ["Kahvaltı", "Börek", "Fırın"],
    puan: 4.3,
    yorum: 1863,
    sureDk: [15, 25],
    minSepet: 50,
    teslimatUcreti: 0,
    etiketler: ["Süper Hızlı", "Sabah Servisi", "Bütçe Dostu"],
    semt: "Kartal",
    teslimat: ANADOLU_DOGU,
  },
  {
    slug: "gece-lezzetleri",
    ad: "Gece Lezzetleri",
    mutfaklar: ["Fast Food", "Tost", "Çorba"],
    puan: 4.2,
    yorum: 2947,
    sureDk: [20, 35],
    minSepet: 75,
    teslimatUcreti: 0,
    kampanya: "00.00 sonrası %20 indirim",
    etiketler: ["Gece Açık"],
    semt: "Zeytinburnu",
    teslimat: AVRUPA_BATI,
  },
  {
    slug: "hizli-market",
    ad: "Hızlı Market",
    mutfaklar: ["Market", "Atıştırmalık", "İçecek"],
    puan: 4.5,
    yorum: 5731,
    sureDk: [10, 20],
    minSepet: 60,
    teslimatUcreti: 0,
    kampanya: "İki alana bir bedava atıştırmalık",
    etiketler: ["Süper Hızlı", "10 Dakikada Kapında"],
    semt: "Pendik",
    teslimat: ANADOLU_DOGU,
  },
  {
    slug: "makbule-sef",
    ad: "Makbule Şef",
    mutfaklar: ["Ev Yemekleri", "Ev Yapımı"],
    puan: 5,
    yorum: 0,
    sureDk: [45, 70],
    minSepet: 100,
    teslimatUcreti: 0,
    etiketler: ["Yeni", "Ev Yapımı"],
    semt: "Beylikdüzü",
    teslimat: AVRUPA_BATI,
    evSefi: true,
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

/** Ana sayfadaki filtre şeridinde kullanılan hızlı filtreler. */
export const hizliFiltreler = [
  { etiket: "Tümü", test: () => true },
  { etiket: "Ev Yapımı", test: (r: Restoran) => r.etiketler.includes("Ev Yapımı") },
  { etiket: "Süper Hızlı", test: (r: Restoran) => r.sureDk[0] <= 20 },
  { etiket: "Kampanyalı", test: (r: Restoran) => Boolean(r.kampanya) },
  { etiket: "4.5 ve üzeri", test: (r: Restoran) => r.puan >= 4.5 },
  { etiket: "Yeni", test: (r: Restoran) => r.etiketler.includes("Yeni") },
] as const;

export const siralamalar = [
  {
    etiket: "Önerilen",
    uygula: (a: Restoran, b: Restoran) =>
      b.puan * Math.log10(b.yorum) - a.puan * Math.log10(a.yorum),
  },
  { etiket: "Puan", uygula: (a: Restoran, b: Restoran) => b.puan - a.puan },
  { etiket: "Teslimat süresi", uygula: (a: Restoran, b: Restoran) => a.sureDk[0] - b.sureDk[0] },
  { etiket: "Min. sepet", uygula: (a: Restoran, b: Restoran) => a.minSepet - b.minSepet },
] as const;
