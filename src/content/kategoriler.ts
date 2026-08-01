import { restoranlar } from "./restoranlar";

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

export type Kategori = {
  slug: string;
  ad: string;
  ikon: KategoriIkonAdi;
  /** Bu kategoriyi hangi mutfak etiketleri karşılıyor (restoranlar.ts `mutfaklar`). */
  mutfaklar: string[];
  /** Restoran yerine mağaza sayılan kategoriler (market vb.). */
  birim?: "restoran" | "mağaza";
};

/**
 * Kategoriler.
 *
 * ÖNEMLİ: Kart altındaki sayı ELLE YAZILMAZ, `kategoriSayisi()` ile gerçek
 * restoran listesinden hesaplanır. Daha önce burada "480+ restoran" gibi
 * uydurma rakamlar duruyordu; platformda toplam 20 mutfak varken bu hem
 * yanıltıcıydı hem de ilk bakışta yakalanan bir tutarsızlıktı.
 */
export const kategoriler: Kategori[] = [
  { slug: "burger", ad: "Burger", ikon: "burger", mutfaklar: ["Burger"] },
  { slug: "pizza", ad: "Pizza", ikon: "pizza", mutfaklar: ["Pizza"] },
  { slug: "doner", ad: "Döner", ikon: "doner", mutfaklar: ["Döner", "Dürüm"] },
  { slug: "tavuk", ad: "Tavuk", ikon: "tavuk", mutfaklar: ["Tavuk", "Kanat"] },
  { slug: "kebap", ad: "Kebap", ikon: "kebap", mutfaklar: ["Kebap", "Izgara"] },
  {
    slug: "ev-yemekleri",
    ad: "Ev Yemekleri",
    ikon: "ev-yemegi",
    mutfaklar: ["Ev Yemekleri", "Ev Yapımı"],
  },
  { slug: "tatli", ad: "Tatlı", ikon: "tatli", mutfaklar: ["Tatlı", "Pasta", "Dondurma"] },
  { slug: "kahve", ad: "Kahve", ikon: "kahve", mutfaklar: ["Kahve", "Kahvaltı"] },
  { slug: "cig-borek", ad: "Çiğ Börek", ikon: "borek", mutfaklar: ["Çiğ Börek", "Börek"] },
  { slug: "balik", ad: "Balık", ikon: "balik", mutfaklar: ["Balık", "Deniz Ürünleri"] },
  { slug: "vegan", ad: "Vegan", ikon: "vegan", mutfaklar: ["Vegan", "Salata", "Sağlıklı"] },
  { slug: "market", ad: "Market", ikon: "market", mutfaklar: ["Market"], birim: "mağaza" },
];

/** Kategoriyi karşılayan gerçek restoran sayısı. */
export function kategoriSayisi(kategori: Kategori): number {
  return restoranlar.filter((r) =>
    r.mutfaklar.some((m) => kategori.mutfaklar.includes(m)),
  ).length;
}

/** Kartın altında yazan bilgi — sayı gerçek, sıfırsa dürüstçe söylenir. */
export function kategoriNotu(kategori: Kategori): string {
  const adet = kategoriSayisi(kategori);
  const birim = kategori.birim ?? "restoran";
  return adet === 0 ? "yakında" : `${adet} ${birim}`;
}
