import crypto from "node:crypto";

import type { NextRequest } from "next/server";

import { depoAl } from "@/lib/depo";
import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, bulunamadi, gecersiz, govdeOku, yasak } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { tamamlandiMi } from "@/lib/siparis";

/**
 * POST /api/mobil/v1/siparis/[no]/yorum
 *
 * Sipariş değerlendirmesi — SICAKLIK, TESLİMAT HIZI ve TAD.
 *
 * Kurallar web'dekiyle aynı ve hepsi SUNUCUDA (bkz. hesabim/yorum-actions):
 *  - Sipariş gerçekten bu kişiye mi ait?
 *  - Teslim edilmiş mi? İptal ya da bekleyen sipariş değerlendirilemez.
 *  - Aynı sipariş ikinci kez değerlendirilemez.
 *
 * Böylece hiç sipariş vermemiş biri puan veremiyor. Uygulamada formu gizlemek
 * (SiparisDetayDto.yorumlanabilir) yalnızca bir kolaylık; asıl denetim burada.
 */
const puanOku = (ham: unknown): number => {
  const sayi = Math.round(Number(ham));
  return Number.isFinite(sayi) && sayi >= 1 && sayi <= 5 ? sayi : 0;
};

export async function POST(
  istek: NextRequest,
  baglam: { params: Promise<{ no: string }> },
) {
  return korumali(istek, {}, async (oturum) => {
    const { no } = await baglam.params;
    const govde = await govdeOku<{
      sicaklik?: number;
      teslimatHizi?: number;
      tad?: number;
      metin?: string;
    }>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const sicaklik = puanOku(govde.sicaklik);
    const teslimatHizi = puanOku(govde.teslimatHizi);
    const tad = puanOku(govde.tad);
    if (!sicaklik || !teslimatHizi || !tad) {
      return gecersiz("Üç başlığı da puanla: sıcaklık, teslimat hızı ve tad.");
    }

    const siparis = await (await depoAl()).bul(no);
    if (!siparis) return bulunamadi("Sipariş bulunamadı.");

    const sahibi =
      (siparis.musteri?.eposta ?? "").trim().toLowerCase() === oturum.eposta.trim().toLowerCase();
    if (!sahibi) return yasak("Bu sipariş sana ait değil.");

    if (!tamamlandiMi(siparis.durum)) {
      return gecersiz("Yalnızca teslim edilmiş siparişleri değerlendirebilirsin.");
    }

    const hesapDepo = await hesapDepoAl();
    if (await hesapDepo.siparisYorumlandiMi(no)) {
      return gecersiz("Bu siparişi zaten değerlendirdin.");
    }

    await hesapDepo.yorumEkle({
      id: crypto.randomUUID(),
      restoranSlug: siparis.restoranSlug,
      siparisNo: no,
      musteriEposta: oturum.eposta,
      musteriAdi: siparis.musteri.adSoyad || oturum.ad,
      sicaklik,
      teslimatHizi,
      tad,
      ...(govde.metin?.trim() ? { metin: govde.metin.trim().slice(0, 1000) } : {}),
      tarih: new Date().toISOString(),
    });

    return basarili({ basari: "Değerlendirmen için teşekkürler." }, 201);
  });
}
