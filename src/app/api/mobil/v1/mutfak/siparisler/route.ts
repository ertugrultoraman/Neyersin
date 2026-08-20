import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { mutfakSiparisleri } from "@/lib/mobil/mutfak";

/**
 * GET /api/mobil/v1/mutfak/siparisler
 *
 * Şefin/işletmenin sipariş tahtası: kendi mutfağının siparişleri + kişisel
 * olarak kendisine atananlar (bkz. lib/sef-siparisleri — web paneliyle aynı
 * liste).
 *
 * MÜŞTERİ ROLÜ GİREMİYOR: rol kontrolü sunucuda. Uygulamada sekmenin gizli
 * olması yalnızca görsel; jetonu elinde tutan biri ucu doğrudan çağırabilir.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) =>
    basarili(await mutfakSiparisleri(oturum.restoranSlug, oturum.eposta)),
  );
}
