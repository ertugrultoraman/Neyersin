import type { NextRequest } from "next/server";

import { basarili, gecersiz, govdeOku } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import { mutfakMenusuYonetim, urunKaydet } from "@/lib/mobil/mutfak";
import type { UrunKaydetGirdisi } from "@/lib/mobil/tipler";

/**
 * GET  /api/mobil/v1/mutfak/urunler → mutfağın menüsü + bölüm listesi
 * POST /api/mobil/v1/mutfak/urunler → ürün ekler ya da günceller
 *
 * BÖLÜMLER AYNI CEVAPTA: ürün formundaki bölüm seçicisi onlarsız çizilemiyor
 * ve liste sabit (içerik dosyasından geliyor). Ayrı bir uç, form açılırken
 * ikinci bir bekleme demek olurdu.
 *
 * MUTFAK OTURUMDAN: hangi mutfağa ürün ekleneceği istekten okunmuyor. Aksi
 * hâlde slug'ı değiştiren biri başkasının menüsüne ürün koyabilirdi.
 */
export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");
    return basarili(await mutfakMenusuYonetim(oturum.restoranSlug));
  });
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const govde = await govdeOku<Partial<UrunKaydetGirdisi>>(istek);
    if (!govde) return gecersiz("İstek gövdesi okunamadı.");

    const sonuc = await urunKaydet(oturum.restoranSlug, {
      ...(govde.id ? { id: govde.id } : {}),
      ad: govde.ad ?? "",
      aciklama: govde.aciklama ?? "",
      bolum: govde.bolum ?? "",
      fiyat: Number(govde.fiyat ?? 0),
      ...(govde.birim ? { birim: govde.birim } : {}),
      yayinda: govde.yayinda !== false,
    });

    if (!sonuc.basarili) return gecersiz(sonuc.hata);
    return basarili(sonuc.urun, govde.id ? 200 : 201);
  });
}
