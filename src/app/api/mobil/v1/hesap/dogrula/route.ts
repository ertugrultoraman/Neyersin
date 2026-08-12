import type { NextRequest } from "next/server";

import { koduDogrula } from "@/lib/dogrulama";
import { epostayiDogrulandiIsaretle, hesapDepoAl } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku, hata } from "@/lib/mobil/cevap";
import { jetonCiftiUret } from "@/lib/mobil/jeton";
import { acik } from "@/lib/mobil/koruma";
import { cihazTemizle, kullaniciDto } from "@/lib/mobil/kullanici";
import type { DogrulamaGirdisi, OturumCevabi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/hesap/dogrula
 *
 * Kaydın ikinci adımı: e-postaya giden kod doğrulanıyor ve OTURUM AÇILIYOR.
 *
 * Doğrulamayla girişin tek çağrıda birleşmesi bilinçli. Ayrılsaydı kullanıcı
 * kodu girdikten hemen sonra bir de parola ekranıyla karşılaşırdı — parolayı
 * bir dakika önce kendisi belirlemişken. Web'de de aynısı oluyor
 * (`kayitDogrulaAction` çerez oturumu açıp yönlendiriyor); burada çerez yerine
 * jeton çifti dönüyor.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<DogrulamaGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const cihaz = cihazTemizle(govde.cihaz);
    const eposta = (govde.eposta ?? "").trim().toLowerCase();
    if (!eposta || !govde.kod || !cihaz) {
      return gecersiz("E-posta, kod ve cihaz bilgisi gerekli.");
    }

    const sonuc = await koduDogrula(eposta, "kayit", govde.kod);
    /*
     * 400 dönüyor, 401 değil: yanlış kod bir KİMLİK hatası değil, girdi
     * hatası. 401 `oturum_gecersiz` ile karışıp istemcide "jetonu tazele"
     * yoluna sapardı — ortada tazelenecek jeton yok.
     */
    if (!sonuc.gecerli) return gecersiz(sonuc.hata);

    await epostayiDogrulandiIsaretle(eposta);

    const hesap = await (await hesapDepoAl()).hesapBul(eposta);
    if (!hesap) return hata("bulunamadi", "Hesap bulunamadı.", 404);

    const oturum = { eposta: hesap.eposta, ad: hesap.ad, rol: hesap.rol };
    const cevap: OturumCevabi = {
      ...jetonCiftiUret(oturum, cihaz),
      kullanici: await kullaniciDto(oturum),
    };
    return basarili(cevap);
  });
}
