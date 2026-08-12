import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { kategoriListesi } from "@/lib/mobil/katalog";
import { acik } from "@/lib/mobil/koruma";

/**
 * GET /api/mobil/v1/katalog/kategoriler
 *
 * Keşfet ekranının üstündeki ray. Kategoriler `content/kategoriler.ts` içinde
 * elle tanımlı; `adet` ise gerçek restoran listesinden sayılıyor.
 *
 * UYGULAMAYA GÖMÜLMÜYOR, uçtan geliyor: gömülü olsaydı yeni bir kategori
 * açmak mağaza güncellemesi bekletirdi ve eski sürümdeki telefonlar o
 * kategorinin mutfaklarını hiç göremezdi.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () => basarili(kategoriListesi()));
}
