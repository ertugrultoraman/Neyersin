import type { NextRequest } from "next/server";

import { kodGonder, postaHazirMi } from "@/lib/dogrulama";
import { musteriKaydet } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { KayitGirdisi, KayitSonucu } from "@/lib/mobil/tipler";
import { ihlalUyarisi, parolaIhlalKontrolu } from "@/lib/parola-ihlali";

/**
 * POST /api/mobil/v1/hesap/kayit
 *
 * Müşteri kaydının BİRİNCİ adımı: hesap açılır, e-postaya 6 haneli kod gider.
 * İkinci adım `/hesap/dogrula` — orada hem e-posta doğrulanıyor hem oturum
 * açılıyor.
 *
 * Hesap açma mantığı web'le ORTAK (`musteriKaydet`): aynı parola kuralı, aynı
 * "bu e-posta zaten kayıtlı" denetimi, aynı `epostaDogrulandi: false` başlangıcı.
 *
 * SIZMIŞ PAROLA UYARISI web'deki akışın aynısı: kişi sızmış bir parola seçerse
 * hesap AÇILMADAN önce uyarılıyor. Uyarı bir ENGEL değil — istemci
 * `parolayiKabulEt: true` gönderirse kayıt tamamlanıyor. Sıkı engelleme
 * insanları kayıttan vazgeçiriyor ve liste dış bir servisin verisi, yanlış
 * eşleşme olabilir. Parola dışarı çıkmıyor (bkz. lib/parola-ihlali.ts).
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<KayitGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const parola = govde.parola ?? "";

    if (!govde.parolayiKabulEt) {
      const uyari = ihlalUyarisi(await parolaIhlalKontrolu(parola));
      if (uyari) {
        const cevap: KayitSonucu = { asama: "parola-uyarisi", uyari };
        return basarili(cevap);
      }
    }

    const sonuc = await musteriKaydet({
      ad: govde.ad ?? "",
      eposta: govde.eposta ?? "",
      parola,
      telefon: govde.telefon ?? "",
    });

    /*
     * Alan bazlı hata dönmüyoruz çünkü `musteriKaydet` tek bir metin veriyor
     * ("Parola en az … olmalı"). Hangi alan olduğunu buradan tahmin etmek,
     * sunucudaki kural değiştiğinde sessizce yanlış alanı işaretlerdi.
     */
    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    const gonderim = await kodGonder(sonuc.veri.eposta, "kayit");

    const cevap: KayitSonucu = {
      asama: "kod",
      eposta: sonuc.veri.eposta,
      /*
       * Posta gitmediyse uygulama bunu SÖYLÜYOR. Sessizce "kodu gönderdik"
       * demek, e-postası hiç gelmeyecek kişiyi kod ekranında bekletirdi;
       * geliştirme ortamında posta yapılandırılmamış olabiliyor.
       */
      postaGitmedi: !postaHazirMi() || (gonderim.basarili && !gonderim.postaGitti),
    };
    return basarili(cevap, 201);
  });
}
