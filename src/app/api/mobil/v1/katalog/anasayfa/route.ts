import type { NextRequest } from "next/server";

import { anasayfaVerisi } from "@/lib/mobil/anasayfa";
import { basarili } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";

/**
 * GET /api/mobil/v1/katalog/anasayfa
 *
 * Keşfet ekranının üst bölümü: kampanyalar, öne çıkan mutfaklar, ayın
 * hanımları, "nasıl çalışır" adımları, sıkça sorulanlar ve yayındaki anket.
 *
 * Mutfak LİSTESİ burada değil — o süzgeçlerle değişiyor ve kendi ucundan
 * geliyor (katalog/restoranlar).
 *
 * Liste ucu gibi giriş istemiyor: uygulamayı yeni indiren kişi hesap açmadan
 * önce ne satıldığını görüyor.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () => basarili(await anasayfaVerisi()));
}
