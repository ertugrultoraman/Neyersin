import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { bekleyenBasvurular } from "@/lib/mobil/yonetim";

/**
 * GET /api/mobil/v1/yonetim/basvurular
 *
 * Onay bekleyen başvurular — en eskisi başta. Karşı tarafta hesabının
 * açılmasını bekleyen bir insan var; sıra "ilk gelen ilk görülür" olmalı.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["admin"] }, async () =>
    basarili(await bekleyenBasvurular()),
  );
}
