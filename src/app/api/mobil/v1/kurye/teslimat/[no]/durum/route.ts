import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku, hata } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { kuryeAdimi } from "@/lib/mobil/kurye";
import type { KuryeAdimGirdisi } from "@/lib/mobil/tipler";

/**
 * POST /api/mobil/v1/kurye/teslimat/[no]/durum
 *
 * Kuryenin iki adımı: `yolda` (teslim aldım) ve `teslim-edildi`.
 *
 * Tek uç, `hedef` alanıyla. İki ayrı uç (`/teslim-aldim`, `/teslim-ettim`)
 * yazılsaydı sahiplik ve sıra denetimi iki yerde tekrarlanırdı; ileride
 * "iade" gibi bir adım eklenince üç olurdu.
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ no: string }> }) {
  return korumali(istek, { roller: ["kurye"] }, async (oturum) => {
    const { no } = await baglam.params;
    const govde = await govdeOku<Partial<KuryeAdimGirdisi>>(istek);

    if (govde?.hedef !== "yolda" && govde?.hedef !== "teslim-edildi") {
      return gecersiz("Geçersiz adım.");
    }

    const sonuc = await kuryeAdimi(no, oturum.eposta, govde.hedef);

    /*
     * 409: istek biçimsel olarak kusursuz, siparişin şu anki durumu izin
     * vermiyor (sipariş uçlarındaki iptalle aynı ayrım).
     */
    return sonuc.tamam
      ? basarili({ siparisNo: no, durum: sonuc.durum })
      : hata("gecersiz_istek", sonuc.sebep, 409);
  });
}
