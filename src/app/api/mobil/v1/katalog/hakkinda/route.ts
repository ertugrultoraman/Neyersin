import type { NextRequest } from "next/server";

import { evHanimlari } from "@/content/ev-hanimlari";
import { site } from "@/content/site";
import { basarili } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { HakkindaDto } from "@/lib/mobil/tipler";

/**
 * GET /api/mobil/v1/katalog/hakkinda
 *
 * Uygulamanın "biz kimiz" ekranı: marka bilgisi, iletişim ve şef olma yolu.
 *
 * UZUN ANLATI SAYFALARI (hakkımızda, ev hanımları, işletmeler, nasıl çalışır)
 * uygulamaya kopyalanmıyor; adresleriyle veriliyor ve tarayıcıda açılıyor.
 * Onlar sürekli düzenlenen, görselli sayfalar — kopyalansalardı web'de
 * değişen her cümle uygulamada eski hâliyle kalırdı.
 *
 * ŞEF OLMA ADIMLARI ise KOPYALANMIYOR ama TAŞINIYOR: dört kısa madde,
 * uygulamanın kendi başvuru ekranının hemen yanında durması gereken bilgi
 * (bkz. content/ev-hanimlari → adimlar). Tek kaynak yine web içeriği.
 *
 * Giriş istemiyor.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () => {
    const cevap: HakkindaDto = {
      ad: site.ad,
      slogan: site.slogan,
      aciklama: site.aciklama,
      telefon: site.telefon,
      eposta: site.eposta,
      adres: site.adres,
      sayfalar: [
        { baslik: "Hakkımızda", adres: `${site.url}/hakkimizda` },
        { baslik: "Ev Hanımları", adres: `${site.url}/ev-hanimlari` },
        { baslik: "İşletmeler", adres: `${site.url}/isletmeler` },
        { baslik: "Nasıl Çalışır", adres: `${site.url}/nasil-calisir` },
        { baslik: "Şeflerin Elinden", adres: `${site.url}/seflerin-elinden` },
      ],
      sefOlmaAdimlari: evHanimlari.adimlar.map((a) => ({
        no: a.no,
        baslik: a.baslik,
        metin: a.metin,
      })),
    };
    return basarili(cevap);
  });
}
