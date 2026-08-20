import type { NextRequest } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { basarili, bulunamadi, gecersiz, govdeOku, yasak } from "@/lib/mobil/cevap";
import { korumali } from "@/lib/mobil/koruma";
import type { YorumDto } from "@/lib/mobil/tipler";

/**
 * GET  /api/mobil/v1/mutfak/yorumlar → mutfağa gelen değerlendirmeler
 * POST /api/mobil/v1/mutfak/yorumlar → bir yoruma cevap yazar (ya da kaldırır)
 *
 * TEK YÖNLÜ DEĞERLENDİRME ADİL DEĞİL: müşteri şikâyet edince şefin "kusura
 * bakmayın, o gün şu oldu" diyebileceği bir yer olmalı. Cevabı yalnızca o
 * mutfağın sahibi (ve yönetici) yazabiliyor.
 *
 * HANGİ MUTFAĞA AİT OLDUĞU YORUMDAN OKUNUYOR, istekten değil: aksi hâlde
 * başka bir şef kendi slug'ını gönderip başkasının yorumuna cevap yazardı
 * (web'deki `yorumYanitlaAction` ile aynı kural).
 *
 * BOŞ CEVAP = CEVABI KALDIR. Ayrı bir silme ucu açmak yerine, kişinin
 * ekranda yaptığı hareketle (metni silip kaydet) aynı şey.
 */
const YANIT_SINIRI = 1000;

export async function GET(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    if (!oturum.restoranSlug) return gecersiz("Bu hesaba bağlı bir mutfak yok.");

    const yorumlar = await (await hesapDepoAl()).yorumlariListele(oturum.restoranSlug);

    return basarili(
      [...yorumlar]
        .sort((a, b) => b.tarih.localeCompare(a.tarih))
        .map(
          (y): YorumDto & { id: string } => ({
            id: y.id,
            musteriAdi: y.musteriAdi,
            sicaklik: y.sicaklik,
            teslimatHizi: y.teslimatHizi,
            tad: y.tad,
            ...(y.metin?.trim() ? { metin: y.metin.trim() } : {}),
            ...(y.yanit?.trim() ? { yanit: y.yanit.trim() } : {}),
            tarih: y.tarih,
          }),
        ),
    );
  });
}

export async function POST(istek: NextRequest) {
  return korumali(istek, { roller: ["sef", "isletme", "admin"] }, async (oturum) => {
    const govde = await govdeOku<{ yorumId?: string; yanit?: string }>(istek);
    const yorumId = govde?.yorumId?.trim() ?? "";
    if (!yorumId) return gecersiz("Yorum belirtilmedi.");

    const depo = await hesapDepoAl();
    const yorum = await depo.yorumBul(yorumId);
    if (!yorum) return bulunamadi("Yorum bulunamadı.");

    const yetkili = oturum.rol === "admin" || oturum.restoranSlug === yorum.restoranSlug;
    if (!yetkili) return yasak("Bu yoruma cevap verme yetkin yok.");

    const yanit = (govde?.yanit ?? "").trim();
    if (yanit.length > YANIT_SINIRI) {
      return gecersiz(`Cevap en fazla ${YANIT_SINIRI} karakter olabilir.`);
    }

    await depo.yorumYanitla(yorumId, yanit.length > 0 ? yanit : undefined);

    return basarili({
      basari: yanit.length > 0 ? "Cevabın yayınlandı." : "Cevabın kaldırıldı.",
    });
  });
}
