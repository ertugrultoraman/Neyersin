import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { kuryeDestegi, kuryeDestekAc } from "@/lib/mobil/destek";
import { korumali } from "@/lib/mobil/koruma";
import type { DestekGirdisi } from "@/lib/mobil/tipler";

/**
 * GET/POST /api/mobil/v1/destek
 *
 * HERKESE AÇIK DESTEK KAPISI — müşteri, şef, işletme, yönetici.
 *
 * Kurye ucundan (kurye/destek) tek farkı ROL KISITININ OLMAMASI; arkasındaki
 * mantık aynı ve talepler aynı listeye düşüyor (bkz. lib/mobil/destek). Ayrı
 * bir müşteri kutusu açılsaydı yönetici iki ekran gezmek zorunda kalır, er ya
 * da geç birine bakmayı unuturdu.
 *
 * SAHİPLİK E-POSTAYLA: liste yalnızca kişinin kendi taleplerini döndürüyor;
 * başkasının talebini numarayla çekmenin yolu yok.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => basarili(await kuryeDestegi(oturum.eposta)));
}

export async function POST(istek: NextRequest) {
  return korumali(istek, {}, async (oturum) => {
    const govde = await govdeOku<Partial<DestekGirdisi>>(istek);

    const sonuc = await kuryeDestekAc(
      { eposta: oturum.eposta, ad: oturum.ad },
      {
        konu: String(govde?.konu ?? ""),
        mesaj: String(govde?.mesaj ?? ""),
        siparisNo: govde?.siparisNo ? String(govde.siparisNo) : undefined,
      },
    );

    return sonuc.tamam ? basarili(sonuc.veri, 201) : gecersiz(sonuc.sebep);
  });
}
