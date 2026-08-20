import type { NextRequest } from "next/server";

import { basarili, gecersiz } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { mutfakOzeti } from "@/lib/mobil/mutfak";

/**
 * GET /api/mobil/v1/mutfak/ozet
 *
 * Panelin üstündeki sayılar: bugünkü sipariş ve ciro, bekleyen iş, fiyatı
 * girilmemiş ürün sayısı ve mutfağın şu an açık olup olmadığı.
 *
 * Sipariş listesinden AYRI bir uç: liste tazelenirken (aşağı çekme) özetin de
 * yeniden hesaplanması gerekmiyor ve özet, listenin tamamı inmeden çizilebiliyor.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");
    return basarili(await mutfakOzeti(oturum.restoranSlug, oturum.eposta));
  });
}
