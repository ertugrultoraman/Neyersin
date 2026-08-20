import type { NextRequest } from "next/server";

import { kodGonder, postaHazirMi } from "@/lib/dogrulama";
import { hesapDepoAl, parolaDogrula, yeniEpostaUygunMu } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku, yasak } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/hesap/eposta-degistir  —  1. ADIM
 *
 * Mevcut parola SORULUYOR: telefonu açık unutulmuş biri adresi kendine
 * çevirip hesabı ele geçiremesin. Kod YENİ adrese gidiyor; kişinin o adrese
 * gerçekten eriştiğini kanıtlaması gerekiyor (web akışının aynısı).
 *
 * Adres bu adımda DEĞİŞMİYOR — yalnızca kod gönderiliyor. İkinci adım
 * `/hesap/eposta-onayla`.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => {
    if (oturum.rol === "admin") {
      return yasak("Yönetici hesabı ortam değişkeninden yönetilir.");
    }

    const govde = await govdeOku<{ parola?: string; yeniEposta?: string }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const hesap = await (await hesapDepoAl()).hesapBul(oturum.eposta);
    if (!hesap) return gecersiz("Hesap bulunamadı.");

    if (!(await parolaDogrula(govde.parola ?? "", hesap.parolaHash))) {
      return gecersiz("Parolan yanlış.");
    }

    const yeni = (govde.yeniEposta ?? "").trim().toLowerCase();
    const uygun = await yeniEpostaUygunMu(oturum.eposta, yeni);
    if (!uygun.basarili) return gecersiz(uygun.hata);

    const gonderim = await kodGonder(yeni, "eposta");
    if (!gonderim.basarili) return gecersiz(gonderim.hata);

    return basarili({
      eposta: yeni,
      /* Posta gitmediyse SÖYLENİYOR: kişi hiç gelmeyecek bir kodu beklemesin. */
      postaGitmedi: !postaHazirMi() || !gonderim.postaGitti,
    });
  });
}
