"use server";

import { urunBul } from "@/content/menuler";
import { restoranBul } from "@/content/restoranlar";
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
      siparisNo: string;
      tutarlar: Tutarlar;
      restoranAdi: string;
      kalemler: SiparisKalemi[];
    }
  | { basarili: false; hatalar: DogrulamaHatalari };

/** İstemciden gelen sepet: yalnızca ürün kimliği ve adet. Fiyat gönderilmez. */
export type SepetGirdisi = { urunId: string; adet: number }[];

export async function siparisOlustur(
  restoranSlug: string,
  sepet: SepetGirdisi,
  form: Omit<SiparisGirdisi, "restoranSlug" | "kalemler">,
): Promise<SiparisSonucu> {
  const restoran = restoranBul(restoranSlug);
  if (!restoran) {
    return { basarili: false, hatalar: { restoran: "Restoran bulunamadı." } };
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
    if (!urun) continue;
    kalemler.push({ urunId: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet });
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
  };

  const hatalar = siparisDogrula(girdi);
  if (Object.keys(hatalar).length > 0) {
    return { basarili: false, hatalar };
  }

  const tutarlar = tutarlariHesapla(kalemler, restoranSlug);
  const siparis: Siparis = {
    ...girdi,
    siparisNo: siparisNoUret(),
    olusturmaTarihi: new Date().toISOString(),
    odemeYontemi: "havale",
    durum: "odeme-bekliyor",
    tutarlar,
    restoranAdi: restoran.ad,
  };

  await siparisiKaydet(siparis);

  return {
    basarili: true,
    siparisNo: siparis.siparisNo,
    tutarlar,
    restoranAdi: restoran.ad,
    kalemler,
  };
}
