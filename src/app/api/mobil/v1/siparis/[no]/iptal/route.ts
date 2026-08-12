import type { NextRequest } from "next/server";

import { basarili, hata } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { siparisIptal } from "@/lib/mobil/siparis";

/**
 * POST /api/mobil/v1/siparis/[no]/iptal
 *
 * Müşterinin kendi siparişini iptali. Kurallar web'dekiyle aynı ve ikisi de
 * `lib/mobil/siparis.ts` üzerinden geçiyor: sipariş bu kişiye ait mi ve durum
 * iptale uygun mu. Ödenmiş sipariş buradan iptal edilemiyor — iade gerekiyor,
 * o yoldan geçmesi lazım.
 *
 * SEBEP AYRIMI YAPILMIYOR: "senin değil" ile "bulunamadı" aynı cevabı
 * dönüyor, aksi hâlde geçerli sipariş numaraları dışarıdan taranabilirdi.
 */
export async function POST(istek: NextRequest, baglam: { params: Promise<{ no: string }> }) {
  return korumali(istek, {}, async (oturum) => {
    const { no } = await baglam.params;
    const sonuc = await siparisIptal(no, oturum.eposta);

    /*
     * 409 (çakışma) seçildi, 400 değil: istek biçimsel olarak KUSURSUZ, yalnızca
     * siparişin şu anki durumu bu işleme izin vermiyor. Uygulama 400'ü form
     * hatası sayıp alanların altına yazıyor; burada yazılacak bir alan yok.
     */
    return sonuc.tamam ? basarili({ siparisNo: no }) : hata("gecersiz_istek", sonuc.sebep, 409);
  });
}
