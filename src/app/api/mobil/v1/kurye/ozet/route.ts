import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import { kuryeOzeti } from "@/lib/mobil/kurye";

/**
 * GET /api/mobil/v1/kurye/ozet
 *
 * Günlük/haftalık teslimat sayısı, hakediş, tahsilat ve kabul oranı.
 *
 * HESAP SUNUCUDA: uygulama teslimat listesinden kendi de sayabilirdi ama
 * hakediş tarifeye bağlı (bkz. lib/kurye-tarife.ts) ve tarife uygulamaya
 * kopyalansaydı, tarife değiştiğinde eski sürümü olan kurye yanlış tutar
 * görürdü — üstelik yanlış olduğunu anlamasının yolu yok. Kabul oranı ise
 * cihazın hiç görmediği kayıtlara dayanıyor.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) =>
    basarili(await kuryeOzeti(oturum.eposta)),
  );
}
