import crypto from "node:crypto";

import Iyzipay from "iyzipay";

import { site } from "@/content/site";
import type { SiparisKalemi, Tutarlar } from "./siparis";

/**
 * iyzico Checkout Form entegrasyonu.
 *
 * Neden Checkout Form? Kart bilgisi iyzico'nun barındırdığı forma giriliyor;
 * bizim sunucumuza hiç ulaşmıyor. Bu, PCI-DSS kapsamını ciddi biçimde
 * daraltır. Kart verisini kendimiz toplayıp API'ye yollayan (Non-3DS/3DS
 * direct) akış bilinçli olarak tercih EDİLMEDİ.
 *
 * Ödemenin gerçekten başarılı olduğuna asla istemciden gelen bilgiyle karar
 * verilmez: iyzico callback'i yalnızca bir token taşır, sonucu sunucudan
 * `odemeSonucuAl()` ile sorgulayıp imzasını doğrularız.
 */

const SANDBOX_URI = "https://sandbox-api.iyzipay.com";

function ayarlar() {
  return {
    apiKey: process.env.IYZICO_API_KEY ?? "",
    secretKey: process.env.IYZICO_SECRET_KEY ?? "",
    uri: process.env.IYZICO_URI ?? SANDBOX_URI,
  };
}

/** Anahtarlar tanımlı mı? Tanımsızsa kart ödemesi arayüzde hiç gösterilmez. */
export function iyzicoYapilandirildiMi(): boolean {
  const { apiKey, secretKey } = ayarlar();
  return apiKey.length > 0 && secretKey.length > 0;
}

/** Sandbox mı canlı mı — arayüzde test modu uyarısı göstermek için. */
export function iyzicoTestModuMu(): boolean {
  return ayarlar().uri.includes("sandbox");
}

function istemci(): Iyzipay {
  const { apiKey, secretKey, uri } = ayarlar();
  if (!apiKey || !secretKey) {
    throw new Error("iyzico anahtarları tanımlı değil (IYZICO_API_KEY / IYZICO_SECRET_KEY).");
  }
  return new Iyzipay({ apiKey, secretKey, uri });
}

/**
 * iyzico yanıtlarının imzasını doğrular: HMAC-SHA256(params.join(":"), secretKey).
 * Doğrulanmayan bir yanıt, ağ üzerinden uydurulmuş olabilir — kabul edilmez.
 */
function imzaGecerliMi(parcalar: (string | undefined)[], imza: string | undefined): boolean {
  if (!imza) return false;
  const { secretKey } = ayarlar();
  const beklenen = crypto
    .createHmac("sha256", secretKey)
    .update(parcalar.map((p) => p ?? "").join(":"))
    .digest("hex");

  const a = Buffer.from(beklenen);
  const b = Buffer.from(imza);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function tl(deger: number): string {
  return deger.toFixed(2);
}

function adSoyadAyir(tam: string): { ad: string; soyad: string } {
  const parcalar = tam.trim().split(/\s+/);
  if (parcalar.length === 1) return { ad: parcalar[0], soyad: parcalar[0] };
  return { ad: parcalar.slice(0, -1).join(" "), soyad: parcalar[parcalar.length - 1] };
}

function gsmNormalize(telefon: string): string {
  const rakamlar = telefon.replace(/\D/g, "");
  const son10 = rakamlar.slice(-10);
  return `+90${son10}`;
}

export type CheckoutFormBaslatGirdisi = {
  siparisNo: string;
  kalemler: SiparisKalemi[];
  tutarlar: Tutarlar;
  restoranAdi: string;
  musteri: { adSoyad: string; telefon: string; eposta: string };
  adres: { ilce: string; mahalle: string; acikAdres: string; binaNo: string; daireNo: string };
  /** İstek başlıklarından alınan istemci IP'si — iyzico risk analizi için. */
  ip: string;
};

export type CheckoutFormBaslatSonucu =
  | { basarili: true; token: string; paymentPageUrl?: string; checkoutFormContent?: string }
  | { basarili: false; hata: string };

export async function checkoutFormBaslat(
  girdi: CheckoutFormBaslatGirdisi,
): Promise<CheckoutFormBaslatSonucu> {
  const { ad, soyad } = adSoyadAyir(girdi.musteri.adSoyad);
  const tamAdres = [
    girdi.adres.acikAdres,
    `No: ${girdi.adres.binaNo}`,
    girdi.adres.daireNo ? `Daire: ${girdi.adres.daireNo}` : null,
    girdi.adres.mahalle,
    `${girdi.adres.ilce} / İstanbul`,
  ]
    .filter(Boolean)
    .join(", ");

  /**
   * iyzico kuralı: basketItems fiyat toplamı `price` ile birebir eşleşmeli.
   * Bu yüzden teslimat ücreti de ayrı bir sepet kalemi olarak gönderiliyor.
   */
  const sepetKalemleri = girdi.kalemler.map((k) => ({
    id: k.urunId,
    name: `${k.ad}${k.adet > 1 ? ` x${k.adet}` : ""}`,
    category1: girdi.restoranAdi,
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: tl(k.fiyat * k.adet),
  }));

  if (girdi.tutarlar.teslimatUcreti > 0) {
    sepetKalemleri.push({
      id: "teslimat",
      name: "Teslimat ücreti",
      category1: "Teslimat",
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: tl(girdi.tutarlar.teslimatUcreti),
    });
  }

  const adres = {
    contactName: girdi.musteri.adSoyad,
    city: "Istanbul",
    country: "Turkey",
    address: tamAdres,
  };

  const istek = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: girdi.siparisNo,
    price: tl(girdi.tutarlar.toplam),
    paidPrice: tl(girdi.tutarlar.toplam),
    currency: Iyzipay.CURRENCY.TRY,
    basketId: girdi.siparisNo,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: `${site.url}/api/odeme/iyzico/callback`,
    // Yemek siparişinde taksit yok — yalnızca tek çekim.
    enabledInstallments: [1],
    buyer: {
      id: girdi.siparisNo,
      name: ad,
      surname: soyad,
      gsmNumber: gsmNormalize(girdi.musteri.telefon),
      email: girdi.musteri.eposta,
      // iyzico bu alanı zorunlu tutuyor. Gerçek TCKN toplamak yemek siparişi
      // için ağır olduğundan varsayılan kullanılıyor; iyzico hesabınızın
      // gerçek kimlik no zorunluluğu varsa IYZICO_IDENTITY_NUMBER ile geçin.
      identityNumber: process.env.IYZICO_IDENTITY_NUMBER ?? "11111111111",
      registrationAddress: tamAdres,
      ip: girdi.ip,
      city: "Istanbul",
      country: "Turkey",
    },
    shippingAddress: adres,
    billingAddress: adres,
    basketItems: sepetKalemleri,
  };

  try {
    const cevap = await new Promise<import("iyzipay").CheckoutFormCevabi>((coz, hata) => {
      istemci().checkoutFormInitialize.create(istek, (e, sonuc) =>
        e ? hata(e) : coz(sonuc),
      );
    });

    if (cevap.status !== "success" || !cevap.token) {
      return {
        basarili: false,
        hata: cevap.errorMessage ?? "iyzico ödeme formu başlatılamadı.",
      };
    }

    if (!imzaGecerliMi([cevap.conversationId, cevap.token], cevap.signature)) {
      console.error(`[iyzico] initialize imzası doğrulanamadı (${girdi.siparisNo})`);
      return { basarili: false, hata: "Ödeme sağlayıcısı yanıtı doğrulanamadı." };
    }

    return {
      basarili: true,
      token: cevap.token,
      paymentPageUrl: cevap.paymentPageUrl,
      checkoutFormContent: cevap.checkoutFormContent,
    };
  } catch (hata) {
    console.error(
      `[iyzico] initialize hatası (${girdi.siparisNo}):`,
      hata instanceof Error ? hata.message : hata,
    );
    return { basarili: false, hata: "Ödeme sağlayıcısına ulaşılamadı. Lütfen tekrar deneyin." };
  }
}

export type OdemeDogrulamaSonucu =
  | {
      durum: "basarili";
      siparisNo: string;
      paymentId: string;
      odenenTutar: string;
    }
  | { durum: "basarisiz"; siparisNo?: string; mesaj: string };

/**
 * Callback'te gelen token ile ödemenin gerçek sonucunu iyzico'dan sorgular ve
 * yanıtın imzasını doğrular. Ödeme "başarılı" kararı YALNIZCA burada verilir.
 */
export async function odemeSonucuAl(token: string): Promise<OdemeDogrulamaSonucu> {
  try {
    const sonuc = await new Promise<import("iyzipay").CheckoutFormSonucu>((coz, hata) => {
      istemci().checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (e, s) =>
        e ? hata(e) : coz(s),
      );
    });

    if (sonuc.status !== "success") {
      return {
        durum: "basarisiz",
        siparisNo: sonuc.conversationId,
        mesaj: sonuc.errorMessage ?? "Ödeme tamamlanamadı.",
      };
    }

    const imzaParcalari = [
      sonuc.paymentStatus,
      sonuc.paymentId,
      sonuc.currency,
      sonuc.basketId,
      sonuc.conversationId,
      sonuc.paidPrice,
      sonuc.price,
      sonuc.token,
    ];

    if (!imzaGecerliMi(imzaParcalari, sonuc.signature)) {
      console.error(`[iyzico] retrieve imzası doğrulanamadı (token: ${token.slice(0, 8)}…)`);
      return { durum: "basarisiz", mesaj: "Ödeme sonucu doğrulanamadı." };
    }

    if (sonuc.paymentStatus !== "SUCCESS") {
      return {
        durum: "basarisiz",
        siparisNo: sonuc.conversationId,
        mesaj: `Ödeme onaylanmadı (${sonuc.paymentStatus ?? "bilinmiyor"}).`,
      };
    }

    return {
      durum: "basarili",
      siparisNo: sonuc.conversationId ?? "",
      paymentId: sonuc.paymentId ?? "",
      odenenTutar: sonuc.paidPrice ?? "",
    };
  } catch (hata) {
    console.error(
      "[iyzico] retrieve hatası:",
      hata instanceof Error ? hata.message : hata,
    );
    return { durum: "basarisiz", mesaj: "Ödeme sonucu sorgulanamadı." };
  }
}
