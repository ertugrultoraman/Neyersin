import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { yonetimOzeti } from "@/lib/mobil/yonetim";

/**
 * GET /api/mobil/v1/yonetim/ozet
 *
 * Yöneticinin ekranındaki sayılar: bekleyen başvuru, fiyat onayı, açık destek
 * talebi, açık sipariş ve günün toplamı.
 *
 * HEPSİ BEKLEYEN İŞ. Toplam ciro ya da kayıtlı kullanıcı gibi rakamlar
 * bilerek yok — bu ekran telefonda açılıyor ve tek sorusu "şu an benden ne
 * bekleniyor".
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["admin"] }, async () => basarili(await yonetimOzeti()));
}
