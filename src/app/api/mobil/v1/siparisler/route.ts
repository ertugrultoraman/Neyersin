import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { siparisListesi } from "@/lib/mobil/siparis";

/**
 * GET /api/mobil/v1/siparisler
 *
 * Giriş yapan kişinin KENDİ siparişleri. Süzgeç yok: liste zaten e-postaya
 * bağlı ve bir kişinin sipariş sayısı elle taranabilecek kadar az. Bir gün
 * çoğalırsa buraya durum süzgeci ve imleç tabanlı sayfalama gelir.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) =>
    basarili(await siparisListesi(oturum.eposta)),
  );
}
