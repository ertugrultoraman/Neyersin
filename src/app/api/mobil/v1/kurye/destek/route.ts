import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { kuryeDestegi, kuryeDestekAc } from "@/lib/mobil/destek";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import type { DestekGirdisi } from "@/lib/mobil/tipler";

/**
 * GET/POST /api/mobil/v1/kurye/destek
 *
 * Kuryenin destek ekranı: yetkilinin telefonu ve kendi taleplerinin listesi;
 * POST ile yeni talep açılıyor.
 *
 * TELEFON DA BU UÇTAN: uygulamaya gömülseydi numara değiştiğinde mağaza
 * güncellemesi gerekirdi ve o arada kurye çalmayan bir numarayı arardı.
 *
 * TALEP AÇMAK "ağır" SINIFTA DEĞİL ama yazma bütçesinden düşüyor (varsayılan):
 * arka arkaya talep açan bir hata döngüsü yöneticinin listesini boğardı.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) =>
    basarili(await kuryeDestegi(oturum.eposta)),
  );
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
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
