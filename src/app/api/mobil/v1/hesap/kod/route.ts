import type { NextRequest } from "next/server";

import { kodGonder, postaHazirMi } from "@/lib/dogrulama";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { KodTekrarGirdisi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/hesap/kod
 *
 * Kod gönderir — hem "gelmedi, tekrar yolla" hem de parola sıfırlama akışının
 * başlangıcı. İki ayrı uç yazmak yerine `amac` alanı taşınıyor; gövde ve
 * kısıtlar birebir aynı, ayrılsalardı sıklık sınırı iki yerde tekrarlanırdı.
 *
 * SIKLIK SINIRI `kodGonder` içinde: aynı adrese dakikada birden fazla kod
 * gitmiyor (bkz. lib/dogrulama.ts). Sınır burada değil orada çünkü web de aynı
 * kapıdan geçiyor; iki taraf için ayrı sayaç tutmak, uygulamadan ve siteden
 * dönüşümlü isteyerek sınırı aşmayı mümkün kılardı.
 *
 * HESAP VARLIĞI SIZDIRILMIYOR: kayıtlı olmayan bir adres için de aynı cevap
 * dönüyor. Aksi hâlde bu uç, bir e-postanın sistemde olup olmadığını
 * öğrenmenin yolu olurdu.
 */
export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<KodTekrarGirdisi>>(istek);
    const eposta = (govde?.eposta ?? "").trim().toLowerCase();
    if (!eposta) return gecersiz("E-posta gerekli.");

    const amac = govde?.amac === "sifre" ? "sifre" : "kayit";
    const gonderim = await kodGonder(eposta, amac);

    /*
     * Sıklık sınırına takılmak GERÇEK bir hata ve kullanıcıya söylenmeli
     * ("38 saniye bekle"); bu, hesabın var olduğunu sızdırmıyor çünkü sayaç
     * adrese göre tutuluyor, hesaba göre değil.
     */
    if (!gonderim.basarili) return gecersiz(gonderim.hata);

    return basarili({
      postaGitmedi: !postaHazirMi() || !gonderim.postaGitti,
    });
  });
}
