import type { NextRequest } from "next/server";

import { BASVURU_TURLERI, basvuruOlustur } from "@/lib/hesaplar";
import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { acik } from "@/lib/mobil/koruma";
import type { BasvuruGirdisi, BasvuruTuruDto } from "@/lib/mobil/tipler";

/**
 * GET  /api/mobil/v1/hesap/basvuru → başvuru türleri (etiket + açıklama)
 * POST /api/mobil/v1/hesap/basvuru → başvuruyu kaydeder
 *
 * TÜRLER SUNUCUDAN GELİYOR, uygulamaya kopyalanmıyor: web'e beşinci bir tür
 * eklendiğinde uygulamada da kendiliğinden görünsün. Kopyalansaydı liste
 * sessizce eskir, kimse fark etmezdi.
 *
 * KAYIT MANTIĞI WEB'LE ORTAK (`basvuruOlustur`): aynı telefon deseni, aynı
 * parola kuralı, aynı "en az 30 karakter tanıtım" şartı.
 *
 * BELGE YÜKLEME YOK: web formunda evrak eklenebiliyor, uygulamada henüz
 * eklenmiyor. Eksik evrakı yönetici başvuruyu incelerken isteyebiliyor —
 * dosya yüklemeyi beklemek başvurunun hiç gönderilememesi demek olurdu.
 */
export async function GET(istek: NextRequest) {
  return acik(istek, async () =>
    basarili(
      BASVURU_TURLERI.map(
        (t): BasvuruTuruDto => ({ deger: t.deger, etiket: t.etiket, aciklama: t.aciklama }),
      ),
    ),
  );
}

export async function POST(istek: NextRequest) {
  return acik(istek, async () => {
    const govde = await govdeOku<Partial<BasvuruGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const sonuc = await basvuruOlustur({
      ad: govde.ad ?? "",
      telefon: govde.telefon ?? "",
      eposta: govde.eposta ?? "",
      parola: govde.parola ?? "",
      tur: govde.tur ?? "",
      mesaj: govde.mesaj ?? "",
    });

    if (!sonuc.basarili) return gecersiz(sonuc.hata);

    /* Yöneticiye bildirim `basvuruOlustur` içinde gidiyor — web formuyla aynı yol. */
    return basarili(
      {
        basari:
          "Başvurun alındı. Yönetici onayladığı anda hesabın açılır ve belirlediğin parolayla giriş yapabilirsin.",
      },
      201,
    );
  });
}
