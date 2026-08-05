import { NextResponse } from "next/server";

import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BAŞVURU BELGESİNİ İNDİRİR — yalnızca yöneticiye.
 *
 * Belgeler kimlik, ruhsat ve bakanlık evrakı; herkese açık bir adrese
 * konulamaz. Bu yüzden dosyalar veritabanında duruyor ve buradan, oturum
 * denetiminden GEÇEREK servis ediliyor. Kimlik tahmin edilemez (UUID) ama
 * tek koruma o değil — yetkisiz istek 404 alıyor.
 *
 * 404 dönüyor, 403 değil: yetkisi olmayan birine "bu kimlikte bir belge var"
 * bilgisini bile vermiyoruz.
 */
export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { id } = await params;
  const belge = await (await hesapDepoAl()).belgeBul(id);
  if (!belge?.veri) return new NextResponse("Not Found", { status: 404 });

  return new NextResponse(new Uint8Array(belge.veri), {
    headers: {
      "Content-Type": belge.mime,
      /*
       * `inline`: PDF ve fotoğraf tarayıcıda açılsın, yönetici her belgeyi
       * indirip açmak zorunda kalmasın. Dosya adı ASCII'ye indirgeniyor —
       * Türkçe karakterli ad başlığı bozuyordu.
       */
      "Content-Disposition": `inline; filename="${belge.ad.replace(/[^\x20-\x7E]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
