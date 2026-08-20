import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { bekleyenFiyatTalepleri } from "@/lib/mobil/yonetim";

/**
 * GET /api/mobil/v1/yonetim/fiyatlar
 *
 * Onaya düşmüş fiyat talepleri. Fiyatı şefin tek başına değiştirmesine izin
 * verilmiyor: fahiş fiyat hem müşteriyi kaçırır hem şef/kurye/sistem
 * arasındaki pay dengesini bozar. Onaya kadar YAYINDAKİ fiyat geçerli.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["admin"] }, async () =>
    basarili(await bekleyenFiyatTalepleri()),
  );
}
