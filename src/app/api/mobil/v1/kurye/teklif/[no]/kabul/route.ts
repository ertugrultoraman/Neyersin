import type { NextRequest } from "next/server";

import { teklifKabul } from "@/lib/kurye-dagitim";
import { basarili, bulunamadi, hata } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import { kuryeTeslimatlari } from "@/lib/mobil/kurye";

/**
 * POST /api/mobil/v1/kurye/teklif/[no]/kabul
 *
 * İşi üstlenir. Aynı teklif birden çok kuryede açık olduğu için burada bir
 * YARIŞ var ve kazanan tek kişi: atama koşullu tek bir SQL ifadesiyle
 * yapılıyor (bkz. depo → kuryeyeAtaKosullu).
 *
 * KABUL EDİLEN TESLİMATIN TAMAMI DÖNÜYOR — açık adres, kapı numarası ve
 * telefonlarla. Uygulama böylece ikinci bir istek atmadan doğrudan teslimat
 * ekranını açabiliyor; kurye "Kabul et"e bastıktan sonra dönen boş bir ekrana
 * bakmıyor. Bu bilgiler teklif kartında YOKTU: kabul etmeden adres
 * görünmüyor (bkz. TeklifDto).
 *
 * 409: istek kusursuz ama iş artık alınamıyor — süresi dolmuş ya da başka
 * kurye kapmış. 404 olsaydı uygulama "sipariş silinmiş" derdi; oysa sipariş
 * duruyor, sadece bu kuryenin değil.
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ no: string }> }) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    const { no } = await baglam.params;

    const sonuc = await teklifKabul(oturum.eposta, no);
    if (!sonuc.tamam) return hata("gecersiz_istek", sonuc.sebep, 409);

    /*
     * Teslimat listeden okunuyor, ayrı bir tekil sorgu yazılmıyor: alım
     * adresini ve mutfak telefonunu çözen mantık `kuryeTeslimatlari` içinde
     * ve ikinci kez yazılsaydı iki yol zamanla ayrışırdı.
     */
    const teslimat = (await kuryeTeslimatlari(oturum.eposta)).find((t) => t.siparisNo === no);
    return teslimat ? basarili(teslimat) : bulunamadi("Teslimat okunamadı.");
  });
}
