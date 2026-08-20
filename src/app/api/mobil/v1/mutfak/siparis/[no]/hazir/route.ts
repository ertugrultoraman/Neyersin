import type { NextRequest } from "next/server";

import { depoAl } from "@/lib/depo";
import { basarili, bulunamadi, gecersiz, yasak } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { mutfakSiparisi } from "@/lib/mobil/mutfak";
import { mutfakSahibiMi } from "@/lib/oturum";
import { calismayaAcikMi } from "@/lib/siparis";

/**
 * POST /api/mobil/v1/mutfak/siparis/[no]/hazir
 *
 * Mutfak "hazır" der — kurye artık alabilir. Web'deki `siparisHazirAction`
 * ile aynı kurallar:
 *  - Yalnızca o siparişin mutfağı ve yönetici çağırabilir. Hangi mutfağa ait
 *    olduğu SİPARİŞTEN okunuyor, istekten gelen bilgiye güvenilmiyor.
 *  - Kapıda ödemeli sipariş de hazır yapılabiliyor: parası kapıda alınacağı
 *    için ömrü boyunca `odeme-bekliyor` kalıyor (bkz. calismayaAcikMi).
 *
 * Cevapta siparişin GÜNCEL HÂLİ dönüyor: uygulama listeyi baştan çekmeden
 * satırı yerinde güncelleyebilsin.
 */
export async function POST(
  istek: NextRequest,
  baglam: { params: Promise<{ no: string }> },
) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const { no } = await baglam.params;

    const depo = await depoAl();
    const siparis = await depo.bul(no);
    if (!siparis) return bulunamadi("Sipariş bulunamadı.");

    const yetkili =
      oturum.rol === "admin" ||
      (mutfakSahibiMi(oturum.rol) && oturum.restoranSlug === siparis.restoranSlug);
    if (!yetkili) return yasak("Bu siparişi güncelleme yetkin yok.");

    if (siparis.durum === "hazir") {
      return gecersiz("Bu sipariş zaten hazır olarak işaretlenmiş.");
    }
    if (!calismayaAcikMi(siparis)) {
      return gecersiz("Bu siparişin ödemesi henüz alınmadı.");
    }

    await depo.durumGuncelle(no, "hazir");
    return basarili(mutfakSiparisi({ ...siparis, durum: "hazir" }));
  });
}
