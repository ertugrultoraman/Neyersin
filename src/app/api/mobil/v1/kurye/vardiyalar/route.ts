import type { NextRequest } from "next/server";

import { kuryeVardiyaPlani } from "@/lib/kurye-vardiya";
import { basarili } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import type { VardiyaPlaniDto } from "@/lib/mobil/tipler";

/**
 * GET /api/mobil/v1/kurye/vardiyalar
 *
 * Kuryenin vardiya planı: süren/sıradaki vardiya, bütün rezervasyonları ve
 * yer ayrılabilecek açık dilimler.
 *
 * BOŞ LİSTE HATA DEĞİL. Yönetici henüz dilim açmadıysa uç boş dönüyor ve
 * uygulama "henüz vardiya planlanmamış" diyor; 404 dönseydi uygulama bunu
 * bağlantı hatası gibi gösterirdi.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    /* Tip, sözleşmeyi derleme anında doğrulatıyor (bkz. lib/mobil/tipler.ts). */
    const plan: VardiyaPlaniDto = await kuryeVardiyaPlani(oturum.eposta);
    return basarili(plan);
  });
}
