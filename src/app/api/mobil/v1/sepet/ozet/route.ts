import type { NextRequest } from "next/server";

import { basarili, bulunamadi, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import { sepetOzeti } from "@/lib/mobil/sepet";
import type { SepetGirdisi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/sepet/ozet
 *
 * Uygulamanın sepetindeki ürün kimliklerini güncel fiyatlara, kupon
 * indirimine ve minimum sepet durumuna çevirir.
 *
 * NEDEN POST: sorgu değil ama sunucuda hiçbir şey de DEĞİŞTİRMİYOR. GET
 * seçilseydi sepetin tamamı sorgu dizesine sığmak zorunda kalırdı (kalem
 * sayısı arttıkça URL uzunluk sınırına takılır) ve ara sunucular tarafından
 * loglanan adreslerde sipariş içeriği görünürdü.
 *
 * GİRİŞ İSTEMİYOR: sepet, kayıt olmadan da dolduruluyor. Kimlik ödeme adımında
 * isteniyor.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<SepetGirdisi>(istek);

    if (!govde || typeof govde.restoranSlug !== "string" || !Array.isArray(govde.kalemler)) {
      return gecersiz("Sepet bilgisi okunamadı.");
    }

    /*
     * BOŞ SEPET DE GEÇERLİ bir sorgu: uygulama son kalemi silince tutarları
     * sıfırlamak için yine buraya soruyor. 400 dönülseydi ekran, sepet
     * boşaldığı anda hata gösterirdi.
     */
    const kalemler = govde.kalemler
      .filter((k) => k && typeof k.urunId === "string" && Number.isFinite(k.adet))
      .map((k) => ({
        urunId: k.urunId,
        adet: k.adet,
        ...(Array.isArray(k.ekstraIdler)
          ? { ekstraIdler: k.ekstraIdler.filter((id) => typeof id === "string") }
          : {}),
      }));

    const ozet = await sepetOzeti({
      restoranSlug: govde.restoranSlug,
      kalemler,
      ...(typeof govde.kuponKodu === "string" ? { kuponKodu: govde.kuponKodu } : {}),
    });

    return ozet ? basarili(ozet) : bulunamadi("Bu mutfak bulunamadı.");
  });
}
