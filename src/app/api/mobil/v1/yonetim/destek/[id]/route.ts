import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, bulunamadi, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/yonetim/destek/[id]
 *
 * Talebe yanıt yazar ve/veya durumunu değiştirir.
 *
 * YANIT YAZMAK "ÇÖZÜLDÜ" DEMEK DEĞİL: ikisi ayrı alanda geliyor — yönetici
 * bir ara bilgi verip talebi açık tutabilmeli (web'deki iki ayrı düğmenin
 * karşılığı).
 */
export async function POST(
  istek: NextRequest,
  baglam: { params: Promise<{ id: string }> },
) {
  return korumali(istek, { roller: ["admin"] }, async () => {
    const { id } = await baglam.params;
    const govde = await govdeOku<{ yanit?: string; durum?: "acik" | "cozuldu" }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const depo = await hesapDepoAl();
    const talep = (await depo.destekListele()).find((t) => t.id === id);
    if (!talep) return bulunamadi("Destek talebi bulunamadı.");

    const yanit = (govde.yanit ?? talep.yanit ?? "").trim().slice(0, 2000);

    await depo.destekGuncelle({
      ...talep,
      ...(yanit ? { yanit } : {}),
      ...(govde.durum ? { durum: govde.durum } : {}),
      guncellemeTarihi: new Date().toISOString(),
    });

    return basarili({ basari: "Talep güncellendi." });
  });
}
