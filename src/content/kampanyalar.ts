import { VARSAYILAN_DIL } from "@/lib/dil";
import { ceviri, type Ceviri } from "@/lib/sozluk";

export type Kampanya = {
  slug: string;
  baslik: string;
  /** İngilizce başlık; yoksa Türkçesi gösteriliyor. */
  baslikEn?: string;
  aciklama: string;
  aciklamaEn?: string;
  kod?: string;
  vurgu: string;
  /** Kart zemininin ton varyasyonu. */
  ton: "sari" | "kahve" | "domates" | "nane";
  /** Kupon kodu varsa indirim türü — sepette gerçekten uygulanır. */
  indirimTuru?: "tutar" | "yuzde";
  indirimDegeri?: number;
  /** Kuponun geçerli olması için gereken minimum ara toplam. */
  minSepet?: number;
  /**
   * Kuponun geçerli olduğu haftanın günleri (0 = Pazar … 6 = Cumartesi).
   * Verilmezse her gün geçerli. Gün her zaman İstanbul saatine göre hesaplanır —
   * sunucunun veya ziyaretçinin saat dilimi kuralı değiştiremez.
   */
  gecerliGunler?: number[];
  /** Yalnızca ilk siparişte geçerli — e-posta adresine göre denetlenir. */
  sadeceIlkSiparis?: boolean;
  /**
   * Aynı e-posta bu kuponu yalnızca bir kez kullanabilir.
   * Varsayılan `true`; sınırsız kullanılabilen bir kupon için açıkça `false` yaz.
   */
  kisiBasiTekKullanim?: boolean;
};

/** İstanbul saatine göre haftanın günü (0 = Pazar … 6 = Cumartesi). */
export function istanbulGunu(tarih: Date = new Date()): number {
  const kisaltmalar = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const kisa = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
  }).format(tarih);
  return kisaltmalar.indexOf(kisa);
}

export const HAFTA_SONU = [0, 6];

/** Sözlük anahtarları — gün adları iki dilde gösteriliyor. */
const GUN_ADLARI = [
  "gun.pazar",
  "gun.pazartesi",
  "gun.sali",
  "gun.carsamba",
  "gun.persembe",
  "gun.cuma",
  "gun.cumartesi",
];

/**
 * [0, 6] → "cumartesi ve pazar günleri" (hafta pazartesiden başlar).
 *
 * ÇEVİRMEN DIŞARIDAN geliyor: bu dosya istemci paketine de giriyor, burada
 * çerez okunamaz. Verilmezse Türkçe kullanılıyor.
 */
export function gunleriYaz(gunler: number[], c: Ceviri = ceviri(VARSAYILAN_DIL)): string {
  const haftaSirasi = (g: number) => (g + 6) % 7; // pazartesi 0 … pazar 6
  const adlar = [...gunler]
    .sort((a, b) => haftaSirasi(a) - haftaSirasi(b))
    .map((g) => c(GUN_ADLARI[g]));
  if (adlar.length === 0) return c("gun.herGun");
  if (adlar.length === 1) return c("gun.tekGun", { gun: adlar[0] });
  return c("gun.cokGun", { bas: adlar.slice(0, -1).join(", "), son: adlar[adlar.length - 1] });
}

/** Kampanya bugün (İstanbul saatiyle) geçerli mi? */
export function kampanyaBugunGecerliMi(kampanya: Kampanya, tarih: Date = new Date()): boolean {
  if (!kampanya.gecerliGunler || kampanya.gecerliGunler.length === 0) return true;
  return kampanya.gecerliGunler.includes(istanbulGunu(tarih));
}

export const kampanyalar: Kampanya[] = [
  {
    slug: "ilk-siparis",
    baslik: "İlk siparişe 60 TL indirim",
    baslikEn: "60 TL off your first order",
    aciklama: "Ne Yersin?'e yeni katıldıysan ilk sepetin bizden hediye. Minimum 225 TL sepet tutarı.",
    aciklamaEn:
      "New to Ne Yersin? Your first cart is on us. Minimum cart total of 225 TL.",
    kod: "MERHABA60",
    vurgu: "60 TL",
    ton: "sari",
    indirimTuru: "tutar",
    indirimDegeri: 60,
    minSepet: 225,
    sadeceIlkSiparis: true,
  },
  {
    slug: "ucretsiz-teslimat",
    baslik: "Tüm restoranlarda ücretsiz teslimat",
    baslikEn: "Free delivery from every restaurant",
    aciklama: "Sepet tutarı ne olursa olsun kurye ücreti yok — tek fiyat: 0 TL.",
    aciklamaEn: "No courier fee whatever your cart total — one price: 0 TL.",
    vurgu: "0 TL",
    ton: "nane",
  },
  {
    slug: "hafta-sonu",
    baslik: "Hafta sonu %25 indirim",
    baslikEn: "25% off at the weekend",
    aciklama:
      "Yalnızca cumartesi ve pazar günleri geçerli. Hafta içi kod çalışmaz. Minimum 100 TL sepet tutarı.",
    aciklamaEn:
      "Valid on Saturdays and Sundays only; the code will not work on weekdays. Minimum cart total of 100 TL.",
    kod: "HAFTASONU25",
    vurgu: "%25",
    ton: "domates",
    indirimTuru: "yuzde",
    indirimDegeri: 25,
    minSepet: 100,
    gecerliGunler: HAFTA_SONU,
  },
  /*
   * GECE30 (gece 00.00 sonrası 30 TL indirim) KALDIRILDI.
   *
   * Bu kupon kullanıcıyla konuşulmadan eklenmişti; indirim bir maliyet
   * taahhüdüdür ve kâr/zarar hesabı yapılmadan tanımlanmaz. Aşağıdaki üç kupon
   * (MERHABA60, HAFTASONU25, SEPET100) kullanıcının kendi kararı olduğu için
   * duruyor. Yeni kupon eklenecekse önce koşulları kararlaştırılmalı.
   */
  {
    slug: "buyuk-sepet",
    baslik: "600 TL ve üzeri sepette 100 TL indirim",
    baslikEn: "100 TL off carts over 600 TL",
    aciklama: "Kalabalık sofralar için: sepetin 600 TL'yi geçtiğinde 100 TL doğrudan düşer.",
    aciklamaEn:
      "For a crowded table: once your cart passes 600 TL, 100 TL comes straight off.",
    kod: "SEPET100",
    vurgu: "100 TL",
    ton: "sari",
    indirimTuru: "tutar",
    indirimDegeri: 100,
    minSepet: 600,
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
  if (!kampanyaBugunGecerliMi(kampanya)) {
    return {
      gecerli: false,
      hata: `Bu kupon yalnızca ${gunleriYaz(kampanya.gecerliGunler ?? [])} geçerli.`,
    };
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
/**
 * Üstteki kayan bandın duyuruları.
 *
 * Metnin kendisi değil SÖZLÜK ANAHTARI tutuluyor: bant hem Türkçe hem
 * İngilizce basılıyor ve çeviriler tek yerden (lib/sozluk.ts) geliyor.
 */
export const duyurular = [
  "duyuru.kuryeTakibi",
  "duyuru.ucretsizTeslimat",
  "duyuru.ilkSiparis",
  "duyuru.sepetIndirimi",
  "duyuru.kapidaOdeme",
  "duyuru.evYemegi",
];
