import { NextResponse } from "next/server";

import { oturumAl } from "@/lib/oturum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Başlıktaki giriş/panel düğmesi için hafif oturum bilgisi.
 *
 * Neden ayrı uç nokta: Header bir istemci bileşeni ve kök layout'ta çerez
 * okumak bütün sayfaları dinamik hâle getirirdi. Bu uç noktayla ana sayfa
 * statik kalıyor, düğme yüklendikten sonra kendini güncelliyor.
 *
 * Yanıt bilinçli olarak minimum: e-posta veya yetki ayrıntısı dönmez.
 */
export async function GET() {
  const oturum = await oturumAl();
  return NextResponse.json(
    oturum
      ? { girisli: true, ad: oturum.ad, rol: oturum.rol }
      : { girisli: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
