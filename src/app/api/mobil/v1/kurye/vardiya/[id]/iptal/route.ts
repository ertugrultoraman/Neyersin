import type { NextRequest } from "next/server";

import { kuryeVardiyaPlani, vardiyaIptal } from "@/lib/kurye-vardiya";
import { basarili, hata } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import type { VardiyaPlaniDto } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/kurye/vardiya/[id]/iptal
 *
 * Rezervasyonu bırakır. Kayıt SİLİNMİYOR, iptal olarak işaretleniyor: "vardiya
 * başlamadan iki saat önce üç kişi düştü" bilgisi kapasite planlamasının en
 * çok işine yarayan şey (bkz. lib/kurye-vardiya).
 *
 * Başlamış vardiya iptal edilemiyor; o durumda 409 dönüyor.
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ id: string }> }) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    const { id } = await baglam.params;

    const sonuc = await vardiyaIptal(oturum.eposta, id);
    if (!sonuc.tamam) return hata("gecersiz_istek", sonuc.sebep, 409);

    const plan: VardiyaPlaniDto = await kuryeVardiyaPlani(oturum.eposta);
    return basarili(plan);
  });
}
