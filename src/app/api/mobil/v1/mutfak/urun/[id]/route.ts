import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, bulunamadi, gecersiz } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";

/**
 * DELETE /api/mobil/v1/mutfak/urun/[id]
 *
 * Ürünü menüden kaldırır. Ürünün BU MUTFAĞA ait olduğu doğrulanıyor —
 * kimliği bilen biri başkasının ürününü silemesin (web'deki `urunSilAction`
 * ile aynı kural).
 *
 * SİPARİŞ GEÇMİŞİ ETKİLENMİYOR: verilmiş siparişler kalemin adını ve fiyatını
 * kendi içinde saklıyor. Ürünü silmek, geçmiş siparişleri boşaltmıyor.
 */
export async function DELETE(
  istek: NextRequest,
  baglam: { params: Promise<{ id: string }> },
) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const { id } = await baglam.params;
    const depo = await hesapDepoAl();
    const urun = await depo.urunBul(id);
    if (!urun || urun.restoranSlug !== oturum.restoranSlug) {
      return bulunamadi("Ürün bulunamadı.");
    }

    await depo.urunSil(id);
    return basarili({ id, ad: urun.ad });
  });
}
