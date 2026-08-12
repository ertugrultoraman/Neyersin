import type { NextRequest } from "next/server";

import { basarili, bulunamadi } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { siparisDetayi } from "@/lib/mobil/siparis";

/**
 * GET /api/mobil/v1/siparis/[no]
 *
 * Sipariş ayrıntısı — yalnızca sahibine. Başkasının siparişi 404 dönüyor,
 * 403 değil: "var ama senin değil" cevabı, sipariş numaralarının geçerliliğini
 * dışarıdan denenebilir hâle getirirdi (bkz. lib/mobil/siparis.ts).
 */
export async function GET(istek: NextRequest, baglam: { params: Promise<{ no: string }> }) {
  return korumali(istek, {}, async (oturum) => {
    const { no } = await baglam.params;
    const detay = await siparisDetayi(no, oturum.eposta);
    return detay ? basarili(detay) : bulunamadi("Sipariş bulunamadı.");
  });
}
