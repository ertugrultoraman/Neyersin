import type { NextRequest } from "next/server";

import { konumYaz } from "@/lib/kurye-dagitim";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import type { KonumGirdisi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/kurye/konum
 *
 * Kuryenin konum bildirimi — müşterinin canlı takibini besleyen tek kaynak.
 *
 * CEVAP BOŞ ve bilerek: uygulama bunu teslimat boyunca düzenli aralıklarla,
 * arka planda çağırıyor. Cevaba veri konsaydı her bildirim gereksiz bayt
 * taşırdı; kuryenin şebekesi zaten en zayıf yer.
 *
 * BU UÇ AYRICA "HAYATTAYIM" SİNYALİ: konum geldiği sürece kurye çevrimiçi
 * sayılıyor (bkz. kurye-dagitim → CEVRIMICI_SAYILMA_SURESI_MS). Ayrı bir
 * yoklama isteği eklemek, aynı bilgiyi ikinci kez taşımak olurdu.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    const govde = await govdeOku<Partial<KonumGirdisi>>(istek);

    const enlem = Number(govde?.enlem);
    const boylam = Number(govde?.boylam);

    /*
     * Aralık denetimi: bozuk bir GPS okuması ya da hatalı istemci sürümü
     * veritabanına anlamsız koordinat yazarsa, müşterinin haritası kuryeyi
     * okyanusun ortasında gösterirdi.
     */
    if (!Number.isFinite(enlem) || enlem < -90 || enlem > 90) {
      return gecersiz("Geçersiz enlem.");
    }
    if (!Number.isFinite(boylam) || boylam < -180 || boylam > 180) {
      return gecersiz("Geçersiz boylam.");
    }

    const sayi = (d: unknown) => (Number.isFinite(Number(d)) ? Number(d) : undefined);

    await konumYaz(oturum.eposta, {
      enlem,
      boylam,
      dogruluk: sayi(govde?.dogruluk),
      yon: sayi(govde?.yon),
      hiz: sayi(govde?.hiz),
    });

    return basarili({});
  });
}
