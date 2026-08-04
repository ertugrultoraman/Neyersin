/**
 * Mutfak menüsünün ORTAK bölümleri.
 *
 * Şef ve ev hanımları ürünlerini bu bölümlerden birine koyar; profil sayfasında
 * ve panelde her yerde AYNI sırada listelenir. Bölüm adlarını şefin serbest
 * metin olarak yazmasına izin verilmiyor — "Anayemek", "ANA YEMEKLER",
 * "Ana yemekler" gibi üç ayrı başlık oluşup menü dağılıyordu.
 *
 * `sira` küçükten büyüğe dizilir; araya yeni bölüm eklenebilsin diye onarlı
 * artıyor.
 */
export type MutfakBolumId =
  | "ana-yemek"
  | "corba"
  | "ara-sicak"
  | "hamur-isi"
  | "salata-meze"
  | "ev-yapimi"
  | "tatli"
  | "icecek";

export type MutfakBolumu = {
  id: MutfakBolumId;
  /** Müşteriye ve panelde görünen başlık. */
  ad: string;
  /** Bölümün ne içerdiğini anlatan kısa cümle — panelde ipucu olarak çıkar. */
  aciklama: string;
  /** İngilizcesi; yoksa Türkçesi gösteriliyor. */
  aciklamaEn?: string;
  /** Ürün adı alanının yer tutucusu. */
  ornek: string;
  ornekEn?: string;
  sira: number;
  /**
   * Bu bölümdeki ürünler tabakta değil, ambalajda satılır: ağırlık/hacim
   * bilgisi (500 g kavanoz, 1 L şişe) müşteri için fiyattan bile önemli.
   * Panelde "birim" alanı yalnızca bu bölümlerde zorunlu gibi vurgulanır.
   */
  birimliMi?: boolean;
};

export const mutfakBolumleri: MutfakBolumu[] = [
  {
    id: "ana-yemek",
    aciklamaEn: "Filling dishes that go in the middle of the table.",
    ornekEn: "e.g. White beans with rice",
    ad: "Ana Yemekler",
    aciklama: "Sofranın ortasına konan, doyurucu yemekler.",
    ornek: "Örn. Kuru fasulye (pilavlı)",
    sira: 10,
  },
  {
    id: "corba",
    aciklamaEn: "Hot soups sold by the bowl.",
    ornekEn: "e.g. Ezogelin soup",
    ad: "Çorbalar",
    aciklama: "Kaseyle satılan sıcak çorbalar.",
    ornek: "Örn. Ezogelin çorbası",
    sira: 20,
  },
  {
    id: "ara-sicak",
    aciklamaEn: "Small hot plates that come before the main course.",
    ornekEn: "e.g. Sigara böreği (6 pcs)",
    ad: "Ara Sıcaklar",
    aciklama: "Ana yemekten önce gelen küçük sıcak tabaklar.",
    ornek: "Örn. Sigara böreği (6 adet)",
    sira: 30,
  },
  {
    id: "hamur-isi",
    aciklamaEn: "Hand-made pastry such as börek, mantı, noodles and poğaça.",
    ornekEn: "e.g. Hand-rolled su böreği",
    ad: "Hamur İşleri",
    aciklama: "Börek, mantı, erişte, poğaça gibi el emeği hamurlar.",
    ornek: "Örn. El açması su böreği",
    sira: 40,
  },
  {
    id: "salata-meze",
    aciklamaEn: "Cold starters and things that go alongside.",
    ornekEn: "e.g. Haydari",
    ad: "Salata & Mezeler",
    aciklama: "Soğuk başlangıçlar ve yanında gidenler.",
    ornek: "Örn. Haydari",
    sira: 50,
  },
  {
    id: "ev-yapimi",
    aciklamaEn: "Products sold in jars or by weight — butter, yoghurt, jam, tarhana and the like.",
    ornekEn: "e.g. Village butter",
    ad: "Ev Yapımı Ürünler",
    aciklama:
      "Tabakta değil, kavanozda/paketle satılanlar: tereyağı, yoğurt, reçel, turşu, salça, erişte, tarhana…",
    ornek: "Örn. Köy tereyağı",
    sira: 60,
    birimliMi: true,
  },
  {
    id: "tatli",
    aciklamaEn: "Milk-based, syrup-based and baked desserts.",
    ornekEn: "e.g. Baked rice pudding",
    ad: "Tatlılar",
    aciklama: "Sütlü, şerbetli ve fırın tatlıları.",
    ornek: "Örn. Fırın sütlaç",
    sira: 70,
  },
  {
    id: "icecek",
    aciklamaEn: "Drinks to go with the food — ayran, lemonade, şalgam…",
    ornekEn: "e.g. Home-made lemonade (1 L)",
    ad: "İçecekler",
    aciklama: "Yanında içilenler — ayran, limonata, şalgam…",
    ornek: "Örn. Ev yapımı limonata (1 L)",
    sira: 80,
    birimliMi: true,
  },
];

const IDYE_GORE = new Map(mutfakBolumleri.map((b) => [b.id, b]));
const ADA_GORE = new Map(mutfakBolumleri.map((b) => [b.ad.toLocaleLowerCase("tr-TR"), b]));

export function bolumBul(id: string): MutfakBolumu | undefined {
  return IDYE_GORE.get(id as MutfakBolumId);
}

/** Geçersiz/eski bir bölüm kimliği gelirse ürün kaybolmasın diye ana yemeğe düşer. */
export function bolumCoz(id: string): MutfakBolumu {
  return bolumBul(id) ?? mutfakBolumleri[0];
}

/**
 * Sabit içerikteki menü başlığını ("Ana Yemekler") bölüme eşler.
 * Eşleşmezse `undefined` — o kategori kendi adıyla, kendi sırasında kalır.
 */
export function bolumAdindanBul(ad: string): MutfakBolumu | undefined {
  return ADA_GORE.get(ad.trim().toLocaleLowerCase("tr-TR"));
}

export const VARSAYILAN_BOLUM: MutfakBolumId = "ana-yemek";
