import type { NextRequest } from "next/server";

import { teklifleriTazele } from "@/lib/kurye-dagitim";
import { basarili } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";

/**
 * GET /api/mobil/v1/kurye/teklifler
 *
 * Kuryeye düşen bekleyen iş teklifleri.
 *
 * UYGULAMANIN YOKLADIĞI UÇ. Çevrimiçi kurye bunu birkaç saniyede bir
 * çağırıyor; bu yüzden uç aynı çağrıda hem süresi dolan teklifleri kapatıyor
 * hem yeni sahipsiz siparişler için teklif üretiyor (bkz. teklifleriTazele).
 * Push bildirimi devreye girdiğinde yoklama seyrekleşecek ama uç aynı kalacak
 * — bildirim yalnızca "hemen bak" demenin bir yolu, verinin kaynağı değil.
 *
 * Çevrimdışı kuryeye BOŞ DİZİ dönüyor, hata değil: uygulama vardiya dışında
 * da açık kalabiliyor ve o durumda hata ekranı göstermek yanlış olurdu.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) =>
    basarili(await teklifleriTazele(oturum.eposta)),
  );
}
