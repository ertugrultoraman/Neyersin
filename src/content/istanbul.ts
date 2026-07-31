/**
 * Hizmet alanı şu an yalnızca İstanbul. Adres girişi serbest metin değil,
 * bu listeden seçim — böylece teslimat bölgesi dışına sipariş açılamıyor.
 */

import { teslimatYapilanIlceler } from "./restoranlar";

export type Yaka = "Avrupa" | "Anadolu";

export type Ilce = {
  ad: string;
  yaka: Yaka;
};

export const ilceler: Ilce[] = [
  { ad: "Adalar", yaka: "Anadolu" },
  { ad: "Arnavutköy", yaka: "Avrupa" },
  { ad: "Ataşehir", yaka: "Anadolu" },
  { ad: "Avcılar", yaka: "Avrupa" },
  { ad: "Bağcılar", yaka: "Avrupa" },
  { ad: "Bahçelievler", yaka: "Avrupa" },
  { ad: "Bakırköy", yaka: "Avrupa" },
  { ad: "Başakşehir", yaka: "Avrupa" },
  { ad: "Bayrampaşa", yaka: "Avrupa" },
  { ad: "Beşiktaş", yaka: "Avrupa" },
  { ad: "Beykoz", yaka: "Anadolu" },
  { ad: "Beylikdüzü", yaka: "Avrupa" },
  { ad: "Beyoğlu", yaka: "Avrupa" },
  { ad: "Büyükçekmece", yaka: "Avrupa" },
  { ad: "Çatalca", yaka: "Avrupa" },
  { ad: "Çekmeköy", yaka: "Anadolu" },
  { ad: "Esenler", yaka: "Avrupa" },
  { ad: "Esenyurt", yaka: "Avrupa" },
  { ad: "Eyüpsultan", yaka: "Avrupa" },
  { ad: "Fatih", yaka: "Avrupa" },
  { ad: "Gaziosmanpaşa", yaka: "Avrupa" },
  { ad: "Güngören", yaka: "Avrupa" },
  { ad: "Kadıköy", yaka: "Anadolu" },
  { ad: "Kağıthane", yaka: "Avrupa" },
  { ad: "Kartal", yaka: "Anadolu" },
  { ad: "Küçükçekmece", yaka: "Avrupa" },
  { ad: "Maltepe", yaka: "Anadolu" },
  { ad: "Pendik", yaka: "Anadolu" },
  { ad: "Sancaktepe", yaka: "Anadolu" },
  { ad: "Sarıyer", yaka: "Avrupa" },
  { ad: "Silivri", yaka: "Avrupa" },
  { ad: "Sultanbeyli", yaka: "Anadolu" },
  { ad: "Sultangazi", yaka: "Avrupa" },
  { ad: "Şile", yaka: "Anadolu" },
  { ad: "Şişli", yaka: "Avrupa" },
  { ad: "Tuzla", yaka: "Anadolu" },
  { ad: "Ümraniye", yaka: "Anadolu" },
  { ad: "Üsküdar", yaka: "Anadolu" },
  { ad: "Zeytinburnu", yaka: "Avrupa" },
];

export const ilceAdlari: string[] = ilceler.map((i) => i.ad);

export function ilceGecerliMi(ad: string): boolean {
  return ilceAdlari.includes(ad);
}

export function ilceBul(ad: string): Ilce | undefined {
  return ilceler.find((i) => i.ad === ad);
}

/** Yaka bazlı gruplama (optgroup için) — İstanbul'un tamamı. */
export function ilcelerYakaya(): { yaka: Yaka; ilceler: string[] }[] {
  return (["Avrupa", "Anadolu"] as Yaka[]).map((yaka) => ({
    yaka,
    ilceler: ilceler.filter((i) => i.yaka === yaka).map((i) => i.ad),
  }));
}

/**
 * Adres seçiminde gösterilecek ilçeler — YALNIZCA teslimat yapılanlar.
 * Liste restoran verisinden türer; teslimat bölgesi büyüdüğünde burası
 * kendiliğinden güncellenir. Müşteriye seçtirip sonra "buraya gelmiyoruz"
 * demek yerine, seçemeyeceği ilçeyi hiç göstermiyoruz.
 */
export function teslimatIlceleriYakaya(): { yaka: Yaka; ilceler: string[] }[] {
  const acik = new Set(teslimatYapilanIlceler());
  return ilcelerYakaya()
    .map((g) => ({ ...g, ilceler: g.ilceler.filter((i) => acik.has(i)) }))
    .filter((g) => g.ilceler.length > 0);
}
