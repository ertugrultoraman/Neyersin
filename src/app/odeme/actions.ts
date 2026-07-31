"use server";

import { headers } from "next/headers";

import { urunBul } from "@/content/menuler";
import type { OdemeYontemi } from "@/content/odeme";
import { restoranBul } from "@/content/restoranlar";
import { checkoutFormBaslat, iyzicoYapilandirildiMi } from "@/lib/iyzico";
import {
  siparisDogrula,
  siparisNoUret,
  telefonNormalize,
  tutarlariHesapla,
  type DogrulamaHatalari,
  type Siparis,
  type SiparisGirdisi,
  type SiparisKalemi,
  type Tutarlar,
} from "@/lib/siparis";
import { siparisiKaydet } from "@/lib/siparis-deposu";

export type SiparisSonucu =
  | {
      basarili: true;
      /** Havale akışı: sipariş numarası ve talimat arayüzde gösterilir. */
      yontem: "havale";
      siparisNo: string;
      tutarlar: Tutarlar;
      restoranAdi: string;
      kalemler: SiparisKalemi[];
    }
  | {
      basarili: true;
      /** Kart akışı: kullanıcı iyzico ödeme sayfasına yönlendirilir. */
      yontem: "iyzico";
      siparisNo: string;
      paymentPageUrl?: string;
      checkoutFormContent?: string;
    }
  | { basarili: false; hatalar: DogrulamaHatalari };

/** İstemciden gelen sepet: yalnızca ürün kimliği, adet ve seçilen ekstra kimlikleri. Fiyat gönderilmez. */
export type SepetGirdisi = { urunId: string; adet: number; ekstraIdleri?: string[] }[];

/** Proxy arkasında gerçek istemci IP'si — iyzico risk analizi için gönderilir. */
async function istemciIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "85.34.78.112";
}

export async function siparisOlustur(
  restoranSlug: string,
  sepet: SepetGirdisi,
  form: Omit<SiparisGirdisi, "restoranSlug" | "kalemler">,
  odemeYontemi: OdemeYontemi = "havale",
): Promise<SiparisSonucu> {
  const restoran = restoranBul(restoranSlug);
  if (!restoran) {
    return { basarili: false, hatalar: { restoran: "Restoran bulunamadı." } };
  }

  if (odemeYontemi === "iyzico" && !iyzicoYapilandirildiMi()) {
    return {
      basarili: false,
      hatalar: { odeme: "Kart ödemesi şu an kullanılamıyor. Havale/EFT ile devam edebilirsin." },
    };
  }

  /**
   * Fiyatlar SUNUCUDA menüden yeniden okunur. İstemcinin gönderdiği tutara
   * güvenilmez — aksi hâlde sepet fiyatı tarayıcıdan değiştirilebilirdi.
   */
  const kalemler: SiparisKalemi[] = [];
  for (const satir of sepet) {
    const adet = Math.floor(Number(satir.adet));
    if (!Number.isFinite(adet) || adet < 1 || adet > 99) continue;
    const urun = urunBul(restoranSlug, satir.urunId);
    if (!urun || urun.taslak) continue;

    // Ekstralar da SUNUCUDAKİ ürün tanımından okunur — istemcinin gönderdiği
    // fiyata güvenilmez, yalnızca hangi ekstra kimliklerinin seçildiğine bakılır.
    const ekstralar = (satir.ekstraIdleri ?? [])
      .map((id) => urun.ekstralar?.find((e) => e.id === id))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map((e) => ({ id: e.id, ad: e.ad, fiyat: e.fiyat }));

    kalemler.push({
      satirId: `${urun.id}::${[...ekstralar].map((e) => e.id).sort().join(",")}`,
      urunId: urun.id,
      ad: urun.ad,
      fiyat: urun.fiyat,
      adet,
      ekstralar: ekstralar.length > 0 ? ekstralar : undefined,
    });
  }

  if (kalemler.length === 0) {
    return { basarili: false, hatalar: { kalemler: "Sepetinizde geçerli ürün yok." } };
  }

  const girdi: SiparisGirdisi = {
    restoranSlug,
    kalemler,
    musteri: {
      adSoyad: (form.musteri.adSoyad ?? "").trim(),
      telefon: telefonNormalize(form.musteri.telefon ?? ""),
      eposta: (form.musteri.eposta ?? "").trim().toLowerCase(),
    },
    adres: {
      ilce: (form.adres.ilce ?? "").trim(),
      mahalle: (form.adres.mahalle ?? "").trim(),
      acikAdres: (form.adres.acikAdres ?? "").trim(),
      binaNo: (form.adres.binaNo ?? "").trim(),
      daireNo: (form.adres.daireNo ?? "").trim(),
      tarif: (form.adres.tarif ?? "").trim(),
    },
    not: (form.not ?? "").trim(),
    kuponKodu: (form.kuponKodu ?? "").trim() || undefined,
  };

  const hatalar = siparisDogrula(girdi);
  if (Object.keys(hatalar).length > 0) {
    return { basarili: false, hatalar };
  }

  const tutarlar = tutarlariHesapla(kalemler, restoranSlug, girdi.kuponKodu);
  const siparisNo = siparisNoUret();
  const siparis: Siparis = {
    ...girdi,
    siparisNo,
    olusturmaTarihi: new Date().toISOString(),
    odemeYontemi,
    durum: "odeme-bekliyor",
    tutarlar,
    restoranAdi: restoran.ad,
  };

  await siparisiKaydet(siparis);

  // --- Kart ödemesi: iyzico Checkout Form -----------------------------------
  if (odemeYontemi === "iyzico") {
    const odemeFormu = await checkoutFormBaslat({
      siparisNo,
      kalemler,
      tutarlar,
      restoranAdi: restoran.ad,
      musteri: girdi.musteri,
      adres: girdi.adres,
      ip: await istemciIp(),
    });

    if (!odemeFormu.basarili) {
      return { basarili: false, hatalar: { odeme: odemeFormu.hata } };
    }

    return {
      basarili: true,
      yontem: "iyzico",
      siparisNo,
      paymentPageUrl: odemeFormu.paymentPageUrl,
      checkoutFormContent: odemeFormu.checkoutFormContent,
    };
  }

  // --- Havale / EFT ---------------------------------------------------------
  return {
    basarili: true,
    yontem: "havale",
    siparisNo,
    tutarlar,
    restoranAdi: restoran.ad,
    kalemler,
  };
}
