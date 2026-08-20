import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, bulunamadi, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/yonetim/fiyat/[urunId]
 *
 * Fiyat talebini onaylar ya da reddeder (gövdedeki `karar`).
 *
 * ONAY: bekleyen fiyat yayına geçiyor. RET: talep siliniyor, yayındaki fiyat
 * olduğu gibi kalıyor. İkisinde de ürünün geri kalanına dokunulmuyor —
 * web'deki fiyatOnayla / fiyatReddet eylemlerinin aynısı.
 */
export async function POST(
  istek: NextRequest,
  baglam: { params: Promise<{ urunId: string }> },
) {
  return korumali(istek, { roller: ["admin"] }, async () => {
    const { urunId } = await baglam.params;
    const govde = await govdeOku<{ karar?: "onayla" | "reddet" }>(istek);
    if (!govde?.karar) return gecersiz("Karar belirtilmedi.");

    const depo = await hesapDepoAl();
    const urun = await depo.urunBul(urunId);
    if (!urun) return bulunamadi("Ürün bulunamadı.");
    if (typeof urun.bekleyenFiyat !== "number") {
      return gecersiz("Bu üründe bekleyen fiyat talebi yok.");
    }

    const onay = govde.karar === "onayla";
    const yeni = urun.bekleyenFiyat;

    await depo.urunKaydet({
      ...urun,
      ...(onay ? { fiyat: yeni } : {}),
      bekleyenFiyat: undefined,
      bekleyenTarih: undefined,
      guncellemeTarihi: new Date().toISOString(),
    });

    return basarili({
      basari: onay
        ? `"${urun.ad}" artık ${yeni} TL.`
        : `"${urun.ad}" için talep reddedildi; fiyat ${urun.fiyat} TL kaldı.`,
    });
  });
}
