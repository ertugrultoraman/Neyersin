import type { NextRequest } from "next/server";

import { teklifRet } from "@/lib/kurye-dagitim";
import { basarili } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/kurye/teklif/[no]/ret
 *
 * Teklifi reddeder; aynı iş bu kuryeye bir daha düşmüyor.
 *
 * HATA DÖNMÜYOR — teklif zaten kapanmışsa (süresi dolmuş, başkası almış)
 * istek sessizce başarılı sayılıyor. Kurye "Reddet"e bastığında sonuç onun
 * açısından aynı: iş ekrandan gitti. Hata göstermek, hiçbir şey
 * düzeltemeyeceği bir uyarıyı sahada okumasını istemek olurdu.
 *
 * Ret kaydı KALICI ve kabul oranına giriyor (bkz. kabulOrani).
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ no: string }> }) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    const { no } = await baglam.params;
    await teklifRet(oturum.eposta, no);
    return basarili({});
  });
}
