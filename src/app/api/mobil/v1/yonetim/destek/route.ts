import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { destekTalepleri } from "@/lib/mobil/yonetim";

/**
 * GET /api/mobil/v1/yonetim/destek
 *
 * Destek talepleri — açık olanlar önce. Kurye ve şef bu talepleri yolda
 * açıyor; yöneticinin de yolda cevaplayabilmesi gerekiyor.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["admin"] }, async () => basarili(await destekTalepleri()));
}
