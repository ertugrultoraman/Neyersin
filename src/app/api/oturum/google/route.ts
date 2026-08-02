import { NextResponse } from "next/server";

import {
  DURUM_COOKIE,
  DURUM_SURESI_SN,
  durumUret,
  googleYapilandirildiMi,
  siteKoku,
  yetkiAdresi,
} from "@/lib/google-oturum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Yönlendirme hedefini site içiyle sınırlar — açık yönlendirme koruması. */
function guvenliDonus(ham: string | null): string {
  if (!ham) return "";
  return ham.startsWith("/") && !ham.startsWith("//") ? ham : "";
}

/**
 * "Google ile devam et" — 1. adım.
 *
 * Rastgele bir `state` ve `nonce` üretilip HTTPONLY çerezde saklanıyor, sonra
 * kullanıcı Google'a yönlendiriliyor. Geri dönüşte ikisi de karşılaştırılıyor:
 * `state` isteğin gerçekten bizden çıktığını (CSRF), `nonce` ise gelen kimlik
 * belirtecinin bu isteğe ait olduğunu kanıtlıyor.
 */
export async function GET(istek: Request) {
  const adres = new URL(istek.url);
  const kok = siteKoku(istek);

  if (!googleYapilandirildiMi()) {
    return NextResponse.redirect(new URL("/hesap/giris?hata=google-kapali", kok));
  }

  const yuk = durumUret(guvenliDonus(adres.searchParams.get("donus")));
  const cevap = NextResponse.redirect(yetkiAdresi(istek, yuk));

  cevap.cookies.set(DURUM_COOKIE, JSON.stringify(yuk), {
    httpOnly: true,
    sameSite: "lax",
    secure: kok.startsWith("https:"),
    path: "/",
    maxAge: DURUM_SURESI_SN,
  });

  return cevap;
}
