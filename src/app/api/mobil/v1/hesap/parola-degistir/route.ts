import type { NextRequest } from "next/server";

import { hesapDepoAl, parolaDegistir } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku, yasak } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/hesap/parola-degistir
 *
 * Web'deki profil ekranındaki parola değiştirme formunun aynısı: aynı
 * `parolaDegistir` çekirdeği, aynı kurallar (mevcut parola doğru mu, yeni
 * parola yeterli mi, iki alan uyuşuyor mu).
 *
 * PAROLASIZ HESAP (Google ile gelen) mevcut parola SORULMUYOR — sorulsaydı
 * hiç belirlemediği bir parolayı yazması istenirdi ve kimse parola
 * belirleyemezdi. Hesapta parola olup olmadığı SUNUCUDA okunuyor; istemcinin
 * "bende yok" demesiyle atlatılamıyor.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => {
    if (oturum.rol === "admin") {
      return yasak("Yönetici parolası ortam değişkeninden yönetilir.");
    }

    const govde = await govdeOku<{
      mevcutParola?: string;
      yeniParola?: string;
      yeniParolaTekrar?: string;
    }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
    const parolasiz = !hesap?.parolaHash;

    const sonuc = await parolaDegistir({
      eposta: oturum.eposta,
      ...(parolasiz ? {} : { mevcutParola: govde.mevcutParola ?? "" }),
      yeniParola: govde.yeniParola ?? "",
      yeniParolaTekrar: govde.yeniParolaTekrar ?? "",
    });
    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    /*
     * OTURUM DÜŞMÜYOR: jeton parolaya değil kimliğe bağlı. Web'de de parola
     * değiştiren kişi çıkışa zorlanmıyor — kendi yaptığı bir işlem yüzünden
     * yeniden giriş istemek, güvenlik kazancı olmayan bir engel olurdu.
     */
    return basarili({
      basari: parolasiz
        ? "Parolan belirlendi. Artık Google ile ya da parolanla girebilirsin."
        : "Parolan değiştirildi. Bir dahaki girişte yeni parolanı kullan.",
    });
  });
}
