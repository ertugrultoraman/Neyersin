import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { restoranListesi } from "@/lib/mobil/katalog";
import { acik } from "@/lib/mobil/koruma";

/**
 * GET /api/mobil/v1/katalog/restoranlar
 *
 * Keşfet ekranının listesi. Süzgeçler sorgu dizesinde:
 *   ?kategori=pizza   content/kategoriler.ts slug'ı
 *   ?ara=mantı        ad, semt, mutfak ve etiketlerde geçen arama
 *   ?tur=sef          yalnızca bireysel mutfaklar (`isletme` tersi)
 *
 * GİRİŞ İSTEMİYOR: menüye bakmak için hesap gerekmiyor. Uygulama ilk açılışta
 * bu ekranı gösterip girişi ancak sipariş anında istiyor; uç korumalı olsaydı
 * indiren herkes önce kayıt ekranıyla karşılaşırdı.
 *
 * SAYFALAMA YOK. Platform tek ilçede çalışıyor ve toplam mutfak sayısı iki
 * haneli; sayfalama, listeyi bölmenin getireceği karmaşıklığı hiçbir kazanç
 * karşılığı olmadan eklerdi. Liste üç haneye çıktığında burası imleç tabanlı
 * sayfalamaya geçmeli — süzgeçler zaten sunucuda uygulanıyor.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () => {
    const parametreler = istek.nextUrl.searchParams;
    const tur = parametreler.get("tur");

    return basarili(
      await restoranListesi({
        kategori: parametreler.get("kategori") ?? undefined,
        ara: parametreler.get("ara") ?? undefined,
        /* Tanınmayan `tur` süzgeç sayılmıyor: liste bölünmüş değil, tam. */
        tur: tur === "sef" || tur === "isletme" ? tur : undefined,
      }),
    );
  });
}
