import type { NextRequest } from "next/server";

import { basarili, bulunamadi } from "@/lib/mobil/cevap";
import { restoranDetayi } from "@/lib/mobil/katalog";
import { acik } from "@/lib/mobil/koruma";

/**
 * GET /api/mobil/v1/katalog/restoran/[slug]
 *
 * Mutfağın özeti + menüsü + değerlendirme özeti TEK cevapta. Menü ayrı bir uca
 * bölünseydi detay ekranı iki gidiş-geliş beklerdi; menü zaten profilin ana
 * içeriği, ayrı istemenin bir faydası yok.
 *
 * Liste ucu gibi giriş istemiyor.
 */
export async function GET(istek: NextRequest, baglam: { params: Promise<{ slug: string }> }) {
  return acik(istek, async () => {
    const { slug } = await baglam.params;
    const detay = await restoranDetayi(slug);
    return detay ? basarili(detay) : bulunamadi("Bu mutfak bulunamadı.");
  });
}
