export type Kampanya = {
  slug: string;
  baslik: string;
  aciklama: string;
  kod?: string;
  vurgu: string;
  /** Kart zemininin ton varyasyonu. */
  ton: "sari" | "kahve" | "domates" | "nane";
  /** Kupon kodu varsa indirim türü — sepette gerçekten uygulanır. */
  indirimTuru?: "tutar" | "yuzde";
  indirimDegeri?: number;
  /** Kuponun geçerli olması için gereken minimum ara toplam. */
  minSepet?: number;
};

export const kampanyalar: Kampanya[] = [
  {
    slug: "ilk-siparis",
    baslik: "İlk siparişe 60 TL indirim",
    aciklama: "Ne Yersin?'e yeni katıldıysan ilk sepetin bizden hediye. Minimum 150 TL sepet tutarı.",
    kod: "MERHABA60",
    vurgu: "60 TL",
    ton: "sari",
    indirimTuru: "tutar",
    indirimDegeri: 60,
    minSepet: 150,
  },
  {
    slug: "ucretsiz-teslimat",
    baslik: "Tüm restoranlarda ücretsiz teslimat",
    aciklama: "Sepet tutarı ne olursa olsun kurye ücreti yok — tek fiyat: 0 TL.",
    vurgu: "0 TL",
    ton: "nane",
  },
  {
    slug: "hafta-sonu",
    baslik: "Hafta sonu %25 indirim",
    aciklama: "Cumartesi ve pazar günleri saat 12.00–16.00 arası tüm ev yemekleri kategorisinde geçerli.",
    kod: "HAFTASONU25",
    vurgu: "%25",
    ton: "domates",
    indirimTuru: "yuzde",
    indirimDegeri: 25,
    minSepet: 100,
  },
  {
    slug: "gece-servisi",
    baslik: "Gece 00.00 sonrası 30 TL indirim",
    aciklama: "Gece açık restoranlarda geçerli. Vardiya sonu için birebir.",
    kod: "GECE30",
    vurgu: "30 TL",
    ton: "kahve",
    indirimTuru: "tutar",
    indirimDegeri: 30,
    minSepet: 80,
  },
  {
    slug: "market-hizli",
    baslik: "Markette 10 dakika sözü",
    aciklama: "Hızlı market siparişin 10 dakikada gelmezse teslimat ücreti cüzdanına geri yüklenir.",
    vurgu: "10 dk",
    ton: "sari",
  },
];

/** Kupon kodunu (büyük/küçük harf duyarsız) arar. */
export function kuponBul(kod: string): Kampanya | undefined {
  const normalize = kod.trim().toLocaleUpperCase("tr-TR");
  return kampanyalar.find((k) => k.kod?.toLocaleUpperCase("tr-TR") === normalize);
}

export type KuponSonucu =
  | { gecerli: true; kampanya: Kampanya; indirim: number }
  | { gecerli: false; hata: string };

/** Kupon kodunu ara toplama göre doğrular ve gerçek indirim tutarını hesaplar. */
export function kuponUygula(kod: string, araToplam: number): KuponSonucu {
  const kampanya = kuponBul(kod);
  if (!kampanya || !kampanya.indirimTuru || !kampanya.indirimDegeri) {
    return { gecerli: false, hata: "Kupon kodu geçersiz." };
  }
  if (kampanya.minSepet && araToplam < kampanya.minSepet) {
    return {
      gecerli: false,
      hata: `Bu kupon için minimum sepet tutarı ${kampanya.minSepet} TL.`,
    };
  }
  const ham =
    kampanya.indirimTuru === "yuzde"
      ? (araToplam * kampanya.indirimDegeri) / 100
      : kampanya.indirimDegeri;
  const indirim = Math.min(Math.round(ham * 100) / 100, araToplam);
  return { gecerli: true, kampanya, indirim };
}

/** Sayfa üstündeki kayan duyuru bandı. */
export const duyurular = [
  "Yeni: canlı kurye takibi tüm İstanbul'da aktif",
  "İstanbul'un 39 ilçesinde tüm restoranlarda ücretsiz teslimat",
  "İlk siparişe 60 TL indirim — kod: MERHABA60",
  "Hızlı markette 10 dakika teslimat sözü",
  "Ödeme yöntemi: havale / EFT",
  "Restoranını ekle, ilk 3 ay komisyonsuz",
];
