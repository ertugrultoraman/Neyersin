export type Kampanya = {
  slug: string;
  baslik: string;
  aciklama: string;
  kod?: string;
  vurgu: string;
  /** Kart zemininin ton varyasyonu. */
  ton: "sari" | "kahve" | "domates" | "nane";
};

export const kampanyalar: Kampanya[] = [
  {
    slug: "ilk-siparis",
    baslik: "İlk siparişe 60 TL indirim",
    aciklama: "Ne Yersin?'e yeni katıldıysan ilk sepetin bizden hediye. Minimum 150 TL sepet tutarı.",
    kod: "MERHABA60",
    vurgu: "60 TL",
    ton: "sari",
  },
  {
    slug: "ucretsiz-teslimat",
    baslik: "Seçili restoranlarda ücretsiz teslimat",
    aciklama: "Ücretsiz teslimat rozetli 900'den fazla restoranda kurye ücreti ödemiyorsun.",
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
  },
  {
    slug: "gece-servisi",
    baslik: "Gece 00.00 sonrası 30 TL indirim",
    aciklama: "Gece açık restoranlarda geçerli. Vardiya sonu için birebir.",
    kod: "GECE30",
    vurgu: "30 TL",
    ton: "kahve",
  },
  {
    slug: "market-hizli",
    baslik: "Markette 10 dakika sözü",
    aciklama: "Hızlı market siparişin 10 dakikada gelmezse teslimat ücreti cüzdanına geri yüklenir.",
    vurgu: "10 dk",
    ton: "sari",
  },
];

/** Sayfa üstündeki kayan duyuru bandı. */
export const duyurular = [
  "Yeni: canlı kurye takibi tüm şehirlerde aktif",
  "900+ restoranda ücretsiz teslimat",
  "İlk siparişe 60 TL indirim — kod: MERHABA60",
  "Hızlı markette 10 dakika teslimat sözü",
  "Restoranını ekle, ilk 3 ay komisyonsuz",
  "Kurye ol, haftalık ödeme al",
];
