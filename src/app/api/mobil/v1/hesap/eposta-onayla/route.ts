import type { NextRequest } from "next/server";

import { koduDogrula } from "@/lib/dogrulama";
import { epostayiDegistir } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { jetonCiftiUret } from "@/lib/mobil/jeton";
import { korumali } from "@/lib/mobil/koruma";
import { kullaniciDto } from "@/lib/mobil/kullanici";
import type { OturumCevabi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/hesap/eposta-onayla  —  2. ADIM
 *
 * Yeni adrese giden kod doğrulanıyor ve adres değişiyor.
 *
 * YENİ JETON ÇİFTİ DÖNÜYOR: eldeki jeton eski adrese yazılmıştı ve bir sonraki
 * istekte artık var olmayan bir hesabı gösterirdi. Web tarafında bunun
 * karşılığı oturum çerezinin yenilenmesi (bkz. epostaDegistirDogrulaAction).
 * Cihaz kimliği jetondan geliyor; istemciden alınsaydı başkasının cihaz
 * kaydına jeton yazdırılabilirdi.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => {
    const govde = await govdeOku<{ eposta?: string; kod?: string }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const yeni = (govde.eposta ?? "").trim().toLowerCase();
    if (!yeni) return gecersiz("Yeni adres belirtilmedi.");

    const kodSonucu = await koduDogrula(yeni, "eposta", govde.kod ?? "");
    if (!kodSonucu.gecerli) return gecersiz(kodSonucu.hata);

    const sonuc = await epostayiDegistir(oturum.eposta, yeni);
    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    const yeniOturum = {
      eposta: yeni,
      ad: oturum.ad,
      rol: oturum.rol,
      ...(oturum.restoranSlug ? { restoranSlug: oturum.restoranSlug } : {}),
      ...(oturum.isletmeYetkisi ? { isletmeYetkisi: oturum.isletmeYetkisi } : {}),
    };

    const cevap: OturumCevabi = {
      ...jetonCiftiUret(yeniOturum, oturum.cihaz),
      kullanici: await kullaniciDto(yeniOturum),
    };

    return basarili({
      ...cevap,
      /* Taşınan sipariş sayısı: web de aynı cümleyi kuruyor. */
      tasinanSiparis: sonuc.veri.tasinanSiparis,
    });
  });
}
