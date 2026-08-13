import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali, KURYE_ROLLERI } from "@/lib/mobil/koruma";
import type { DurumGirdisi, KuryeDurumuDto } from "@/lib/mobil/tipler";
import { ARAC_TURLERI, durumOku, durumYaz, type AracTuru } from "@/lib/kurye-dagitim";

/**
 * GET/POST /api/mobil/v1/kurye/durum
 *
 * Kuryenin çevrimiçi/çevrimdışı durumu ve aracı.
 *
 * ARAÇ NEDEN BURADA: "Çalışmaya başla" ekranı her vardiyada araç soruyor
 * çünkü aynı kişi bir gün motosikletle, ertesi gün bisikletle çıkabiliyor.
 * Hesap profiline yazılsaydı, araç değiştiren kurye ayarlara girip
 * güncellemeyi hatırlamak zorunda kalırdı.
 */
function dtoyaCevir(durum: Awaited<ReturnType<typeof durumOku>>): KuryeDurumuDto {
  return {
    cevrimici: durum?.cevrimici ?? false,
    arac: durum?.arac ?? null,
    konum:
      durum?.konum && durum.konumTarihi
        ? { ...durum.konum, tarih: durum.konumTarihi }
        : null,
  };
}

export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) =>
    basarili(dtoyaCevir(await durumOku(oturum.eposta))),
  );
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: KURYE_ROLLERI }, async (oturum) => {
    const govde = await govdeOku<Partial<DurumGirdisi>>(istek);

    if (typeof govde?.cevrimici !== "boolean") {
      return gecersiz("Çevrimiçi bilgisi eksik.");
    }
    if (govde.arac !== undefined && !ARAC_TURLERI.includes(govde.arac as AracTuru)) {
      return gecersiz("Geçersiz araç türü.");
    }

    /*
     * Çevrimiçi olurken araç ZORUNLU. Araçsız çevrimiçi bir kurye teklif
     * almaya başlardı ve yönetici sahada kimin neyle olduğunu göremezdi;
     * çevrimdışı olurken sormanın ise anlamı yok.
     */
    const mevcut = await durumOku(oturum.eposta);
    if (govde.cevrimici && !govde.arac && !mevcut?.arac) {
      return gecersiz("Önce aracını seç.");
    }

    return basarili(
      dtoyaCevir(
        await durumYaz(oturum.eposta, {
          cevrimici: govde.cevrimici,
          arac: (govde.arac as AracTuru | undefined) ?? null,
        }),
      ),
    );
  });
}
