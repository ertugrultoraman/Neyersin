import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku, hata } from "@/lib/mobil/cevap";
import { cihaziKaydet } from "@/lib/mobil/cihazlar";
import { jetonCiftiUret } from "@/lib/mobil/jeton";
import { acik } from "@/lib/mobil/koruma";
import { cihazTemizle, kullaniciDto } from "@/lib/mobil/kullanici";
import type { GirisGirdisi, OturumCevabi } from "@/lib/mobil/tipler";
import { kimlikDogrula } from "@/lib/oturum";

/**
 * POST /api/mobil/v1/oturum/giris
 *
 * Web'deki giriş formuyla AYNI kapıyı kullanıyor (`kimlikDogrula`): aynı kaba
 * kuvvet sayacı, aynı "hangi adımda takıldığını sızdırma" kuralı, aynı
 * yönetici/şef ayrımı. Fark yalnızca sonucun taşınma biçimi — çerez yerine
 * jeton çifti.
 *
 * Rol kısıtı YOK: müşteri, şef, işletme, kurye ve yönetici aynı uçtan giriyor.
 * Hangi uygulamanın hangi rolü kabul ettiği istemci tarafında belirleniyor
 * (kurye uygulaması kurye olmayanı içeri almıyor) — sunucu tarafında ayırmak,
 * aynı kişinin iki uygulamayı da kullanmasını gereksiz yere engellerdi.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<GirisGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const cihaz = cihazTemizle(govde.cihaz);
    if (!govde.kimlik || !govde.parola || !cihaz) {
      return gecersiz("E-posta, parola ve cihaz bilgisi gerekli.");
    }

    const sonuc = await kimlikDogrula(govde.kimlik, govde.parola);
    if (!sonuc.basarili) {
      /*
       * Kod `oturum_gecersiz` DEĞİL. O kod istemcide "jetonu tazele, isteği
       * tekrarla" anlamına geliyor; girişin kendisi başarısız olduğunda
       * tazelenecek bir jeton yok ve istemci sonsuz döngüye girerdi.
       */
      return hata("gecersiz_istek", sonuc.hata, 401);
    }

    /*
     * Cihaz kaydediliyor ve varsa eski iptali kalkıyor: telefonunu bulan ya da
     * yeniden kuran kişi parolasını biliyorsa girebilmeli (bkz. cihazlar.ts).
     * Bekleniyor, çünkü giriş anında kayıt açılmazsa "cihazlarım" listesi
     * eksik kalır ve iptal edilecek bir satır olmaz.
     */
    await cihaziKaydet(sonuc.oturum.eposta, cihaz);

    const cevap: OturumCevabi = {
      ...jetonCiftiUret(sonuc.oturum, cihaz),
      kullanici: await kullaniciDto(sonuc.oturum),
    };
    return basarili(cevap);
  });
}
