import type { NextRequest } from "next/server";

import { basvuruOnayla, basvuruReddet, type BasvuruTuru } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/yonetim/basvuru/[id]
 *
 * Başvuruyu onaylar ya da reddeder; gövdedeki `karar` alanı ayırıyor.
 *
 * TEK UÇ, İKİ KARAR: ikisi de aynı kaydın üstünde ve aynı yetkiyi istiyor.
 * Ayrı uçlar açmak, aynı doğrulamayı iki yerde tekrarlamak olurdu.
 *
 * ONAY ANINDA HESAP AÇILIYOR (bkz. lib/hesaplar → basvuruOnayla): kişi
 * başvururken belirlediği parolayla doğrudan giriş yapıyor, ayrıca kayıt
 * olmuyor. Kurye dışındaki rollerde kişinin ADIYLA yeni bir mutfak sayfası
 * açılıyor — kimse hazır bir başkasının profiline atanmıyor.
 */
export async function POST(
  istek: NextRequest,
  baglam: { params: Promise<{ id: string }> },
) {
  return korumali(istek, { roller: ["admin"] }, async () => {
    const { id } = await baglam.params;
    const govde = await govdeOku<{
      karar?: "onayla" | "reddet";
      rol?: string;
      semt?: string;
      not?: string;
    }>(istek);
    if (!govde?.karar) return gecersiz("Karar belirtilmedi.");

    if (govde.karar === "reddet") {
      const sonuc = await basvuruReddet(id, (govde.not ?? "").trim());
      if (!sonuc.basarili) return gecersiz(sonuc.hata);
      return basarili({ basari: "Başvuru reddedildi." });
    }

    const sonuc = await basvuruOnayla({
      id,
      rol: (govde.rol ?? "") as BasvuruTuru,
      semt: (govde.semt ?? "").trim(),
      not: (govde.not ?? "").trim(),
    });
    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    return basarili({
      basari: sonuc.veri.atananRestoran
        ? `Onaylandı, hesap açıldı. Mutfak sayfası: /restoran/${sonuc.veri.atananRestoran}`
        : "Onaylandı, kurye hesabı açıldı. Kişi artık giriş yapabilir.",
    });
  });
}
