"use server";

import { headers } from "next/headers";

import type { OdemeYontemi } from "@/content/odeme";
import { aktifDil } from "@/lib/dil-sunucu";
import { oturumAl } from "@/lib/oturum";
import type { SiparisGirdisi } from "@/lib/siparis";
import {
  siparisOlustur as siparisiOlustur,
  type SepetSatiri,
  type SiparisSonucu,
} from "@/lib/siparis-olustur";
import { ceviri } from "@/lib/sozluk";

export type { SiparisSonucu };

/** İstemciden gelen sepet: yalnızca ürün kimliği, adet ve seçilen ekstra kimlikleri. Fiyat gönderilmez. */
export type SepetGirdisi = SepetSatiri[];

/** Proxy arkasında gerçek istemci IP'si — iyzico risk analizi için gönderilir. */
async function istemciIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "85.34.78.112";
}

/**
 * Web ödeme formunun sipariş eylemi.
 *
 * Asıl mantık `lib/siparis-olustur.ts` içinde; burası yalnızca WEB BAĞLAMINI
 * topluyor: oturum çerezden, dil çerezden, IP başlıklardan. Mobil uç aynı
 * fonksiyonu Bearer jetonundan çözdüğü oturumla çağırıyor.
 */
export async function siparisOlustur(
  restoranSlug: string,
  sepet: SepetGirdisi,
  form: Omit<SiparisGirdisi, "restoranSlug" | "kalemler">,
  odemeYontemi: OdemeYontemi = "havale",
): Promise<SiparisSonucu> {
  const c = ceviri(await aktifDil());

  /**
   * Sipariş için giriş zorunlu ve e-posta OTURUMDAN alınır.
   *
   * Formdaki e-postaya güvenmek, kişi başı kupon sınırını başka bir adres
   * yazarak aşmayı ve siparişi başkasının hesabına düşürmeyi mümkün kılardı.
   */
  const oturum = await oturumAl();
  if (!oturum) {
    return { basarili: false, hatalar: { odeme: c("hata.girisGerekli") } };
  }

  return siparisiOlustur({
    restoranSlug,
    sepet,
    form,
    odemeYontemi,
    oturumEpostasi: oturum.eposta,
    ip: await istemciIp(),
    c,
  });
}
