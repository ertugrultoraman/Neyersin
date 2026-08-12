import type { NextRequest } from "next/server";

import { koduDogrula } from "@/lib/dogrulama";
import { parolaDegistir } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { ParolaSifirlamaGirdisi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/hesap/parola-sifirla
 *
 * Parolayı unutmuş kullanıcı için: e-postaya giden kodla yeni parola
 * belirleniyor. Kod `/hesap/kod` ucundan `amac: "sifre"` ile isteniyor.
 *
 * MEVCUT PAROLA SORULMUYOR — zaten bilinmiyor. Kimlik, e-posta kutusuna
 * erişimle kanıtlanıyor; `parolaDegistir` bu yüzden `mevcutParola` almadan
 * çağrılıyor (bkz. lib/hesaplar → parolaDegistir açıklaması).
 *
 * OTURUM AÇILMIYOR. Kayıt doğrulamasının aksine burada kullanıcı yeni
 * parolasını bir kez de giriş ekranında yazıyor; parola sıfırlama genelde
 * "hesabım çalınmış olabilir" şüphesiyle yapılıyor ve o anda otomatik oturum
 * açmak, akışı başlatanın gerçekten hesap sahibi olduğu varsayımına dayanırdı.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<ParolaSifirlamaGirdisi>>(istek);
    const eposta = (govde?.eposta ?? "").trim().toLowerCase();
    if (!govde || !eposta || !govde.kod) return gecersiz("E-posta ve kod gerekli.");

    const kodSonucu = await koduDogrula(eposta, "sifre", govde.kod);
    if (!kodSonucu.gecerli) return gecersiz(kodSonucu.hata);

    const sonuc = await parolaDegistir({
      eposta,
      yeniParola: govde.yeniParola ?? "",
      yeniParolaTekrar: govde.yeniParolaTekrar ?? "",
    });
    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    return basarili({ eposta });
  });
}
