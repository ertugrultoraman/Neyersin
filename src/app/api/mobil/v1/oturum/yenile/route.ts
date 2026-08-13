import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku, hata } from "@/lib/mobil/cevap";
import { cihazIptalEdilmisMi, cihaziGorduk } from "@/lib/mobil/cihazlar";
import { jetonCiftiUret, yenilemeJetonuCoz, type OturumBilgisi } from "@/lib/mobil/jeton";
import { acik } from "@/lib/mobil/koruma";
import { cihazTemizle, kullaniciDto } from "@/lib/mobil/kullanici";
import type { OturumCevabi, YenilemeGirdisi } from "@/lib/mobil/tipler";
import { adminMi, adminOturumEpostasi } from "@/lib/oturum";

/**
 * POST /api/mobil/v1/oturum/yenile
 *
 * YETKİ TAZELİĞİNİN SAĞLANDIĞI YER. Yenileme jetonu bilerek yalnızca kimlik
 * taşıyor (kim + hangi cihaz); rol, mutfak ve işletme yetkisi burada hesap
 * kaydından YENİDEN okunuyor.
 *
 * Bunun sonucu şu: yönetici birinin rolünü düşürdüğünde ya da hesabını
 * sildiğinde, değişiklik en geç bir saat içinde (erişim jetonunun ömrü)
 * uygulamaya yansıyor. Rol yenileme jetonunun içinde taşınsaydı, 180 gün
 * boyunca eski yetkiyle gezilebilirdi.
 *
 * Jeton çifti her seferinde YENİDEN üretiliyor (rotasyon): kullanan kişi
 * uygulamayı aktif kullandığı sürece yenileme jetonu da tazeleniyor, yani
 * uzun süre kullanmayan cihazlar kendiliğinden düşüyor.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<YenilemeGirdisi>>(istek);
    const cihaz = cihazTemizle(govde?.cihaz);
    if (!govde?.yenilemeJetonu || !cihaz) {
      return gecersiz("Yenileme jetonu ve cihaz bilgisi gerekli.");
    }

    const yuk = yenilemeJetonuCoz(govde.yenilemeJetonu);
    if (!yuk) {
      return hata("oturum_gecersiz", "Oturumunuz sona erdi, tekrar giriş yapın.", 401);
    }

    /*
     * Cihaz eşleşmesi: jeton bir cihaza yazıldı, başka cihazdan gelen aynı
     * jeton kabul edilmiyor. Jeton kopyalanmışsa (yedekten geri yükleme,
     * cihaz klonlama) sessizce çalışmak yerine yeniden giriş isteniyor.
     */
    if (yuk.cihaz !== cihaz) {
      return hata("oturum_gecersiz", "Oturum bu cihaza ait değil, tekrar giriş yapın.", 401);
    }

    /*
     * OTURUM İPTALİ TAM BURADA. Jetonlar durum tutmadığı için tek tek geri
     * çağrılamıyor; iptal edilen cihaz yenileme sırasında yakalanıyor
     * (bkz. lib/mobil/cihazlar.ts). Her istekte bakılsaydı, saniyede gelen
     * teklif yoklamalarının hepsine bir veritabanı okuması eklenirdi.
     */
    if (await cihazIptalEdilmisMi(yuk.eposta, cihaz)) {
      return hata("oturum_gecersiz", "Bu cihazın oturumu kapatılmış, tekrar giriş yapın.", 401);
    }

    const bilgi = await oturumBilgisiTazele(yuk.eposta);
    if (!bilgi) {
      return hata("oturum_gecersiz", "Hesabınıza ulaşılamadı, tekrar giriş yapın.", 401);
    }

    /* Bekletilmiyor: "son görülme" bir denetim damgası, cevabı geciktirmemeli. */
    void cihaziGorduk(yuk.eposta, cihaz);

    const cevap: OturumCevabi = {
      ...jetonCiftiUret(bilgi, cihaz),
      kullanici: await kullaniciDto(bilgi),
    };
    return basarili(cevap);
  });
}

/**
 * Hesabın GÜNCEL yetkilerini okur. Hesap silinmişse null.
 *
 * Yönetici için veritabanında kayıt yok; yöneticilik `ADMIN_EMAILS` listesine
 * bakılarak belirleniyor. Listeden çıkarılan kişi burada null alıyor ve
 * yenileme düşüyor.
 */
async function oturumBilgisiTazele(eposta: string): Promise<OturumBilgisi | null> {
  if (adminMi(eposta)) {
    /*
     * Adres burada da düzeltiliyor: yenileme jetonunun ömrü 180 gün ve
     * kullanıcı adıyla açılmış eski bir jeton içinde "admin" taşıyor. Düzelt-
     * meseydik o cihaz aylarca e-postasız bir kimlikle gezerdi (bkz.
     * lib/oturum.ts → adminOturumEpostasi).
     */
    return { eposta: adminOturumEpostasi(eposta), ad: "Yönetici", rol: "admin" };
  }

  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(eposta);
  if (!hesap) return null;

  return {
    eposta: hesap.eposta,
    ad: hesap.ad,
    rol: hesap.rol,
    restoranSlug: hesap.restoranSlug,
    isletmeYetkisi: hesap.isletmeYetkisi,
  };
}
