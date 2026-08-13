import type { NextRequest } from "next/server";

import { kuryeVardiyaPlani, vardiyaRezerve } from "@/lib/kurye-vardiya";
import { basarili, hata } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import type { VardiyaPlaniDto } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/kurye/vardiya/[id]/rezerve
 *
 * Dilime yer ayırır. Son yer için YARIŞ var: kontenjan işlem içinde kilitli
 * okunuyor (bkz. lib/kurye-vardiya → vardiyaRezerve).
 *
 * 409: istek kusursuz ama yer kalmamış ya da vardiya başlamış. 404 olsaydı
 * uygulama "vardiya silinmiş" derdi; oysa vardiya duruyor, sadece dolu.
 *
 * PLANIN TAMAMI DÖNÜYOR — uygulama ikinci bir istek atmadan listeyi
 * tazeliyor. Yalnızca "tamam" dönseydi, kurye yer ayırdıktan sonra doluluk
 * sayısı bir sonraki yenilemeye kadar eski kalırdı.
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ id: string }> }) {
  return korumali(istek, { roller: ["kurye"] }, async (oturum) => {
    const { id } = await baglam.params;

    const sonuc = await vardiyaRezerve(oturum.eposta, id);
    if (!sonuc.tamam) return hata("gecersiz_istek", sonuc.sebep, 409);

    const plan: VardiyaPlaniDto = await kuryeVardiyaPlani(oturum.eposta);
    return basarili(plan);
  });
}
