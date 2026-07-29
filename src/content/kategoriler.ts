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
  /** Kartın altında gösterilen kısa bilgi. */
  not: string;
};

export const kategoriler: Kategori[] = [
  { slug: "burger", ad: "Burger", ikon: "burger", not: "480+ restoran" },
  { slug: "pizza", ad: "Pizza", ikon: "pizza", not: "390+ restoran" },
  { slug: "doner", ad: "Döner", ikon: "doner", not: "620+ restoran" },
  { slug: "tavuk", ad: "Tavuk", ikon: "tavuk", not: "310+ restoran" },
  { slug: "kebap", ad: "Kebap", ikon: "kebap", not: "270+ restoran" },
  { slug: "ev-yemekleri", ad: "Ev Yemekleri", ikon: "ev-yemegi", not: "540+ restoran" },
  { slug: "tatli", ad: "Tatlı", ikon: "tatli", not: "410+ restoran" },
  { slug: "kahve", ad: "Kahve", ikon: "kahve", not: "260+ restoran" },
  { slug: "cig-borek", ad: "Çiğ Börek", ikon: "borek", not: "120+ restoran" },
  { slug: "balik", ad: "Balık", ikon: "balik", not: "95+ restoran" },
  { slug: "vegan", ad: "Vegan", ikon: "vegan", not: "140+ restoran" },
  { slug: "market", ad: "Market", ikon: "market", not: "230+ mağaza" },
];
