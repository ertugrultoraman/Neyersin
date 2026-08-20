import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { SiralamaDto, SiralamaSatiriDto } from "@/lib/mobil/tipler";
import { olcutCoz } from "@/lib/sef-kasigi";
import { olcutSayilari, sefSiralamasi } from "@/lib/sef-siralamasi";

/**
 * GET /api/mobil/v1/katalog/siralama?olcut=siparis|begeni|kasik
 *
 * Web'deki /sef-siralamasi sayfasının karşılığı.
 *
 * TANINMAYAN ÖLÇÜT sessizce "siparis" oluyor (olcutCoz) — hatalı bir bağlantı
 * boş sayfa yerine çalışan bir liste gösteriyor. Sayfa süsleyici; ölçüt
 * yazımı yüzünden 400 dönmek, gösterilecek veri varken hiçbir şey
 * göstermemek olurdu.
 *
 * Giriş istemiyor: sıralama herkese açık.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () => {
    const olcut = olcutCoz(istek.nextUrl.searchParams.get("olcut") ?? undefined);
    const [satirlar, sayilar] = await Promise.all([sefSiralamasi(olcut), olcutSayilari()]);

    const cevap: SiralamaDto = {
      olcut,
      satirlar: satirlar.map(
        (s): SiralamaSatiriDto => ({
          sira: s.sira,
          slug: s.slug,
          ad: s.ad,
          semt: s.semt,
          deger: s.deger,
          siparis: s.siparis,
          puan: s.puan,
          yorum: s.yorum,
          kasik: s.kasik,
          ...(s.basamak ? { basamak: s.basamak } : {}),
        }),
      ),
      sayilar,
    };
    return basarili(cevap);
  });
}
