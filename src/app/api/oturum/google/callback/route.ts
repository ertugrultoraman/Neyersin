import { NextResponse, type NextRequest } from "next/server";

import { DURUM_COOKIE, esitMi, kimligiAl, siteKoku, type DurumYuku } from "@/lib/google-oturum";
import { googleHesabiCoz } from "@/lib/hesaplar";
import { adminMi, oturumAc, rolAnaSayfasi } from "@/lib/oturum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hata mesajını giriş ekranına taşır; ayrıntı kullanıcıya sızmaz. */
function hataylaDon(kok: string, anahtar: string) {
  const cevap = NextResponse.redirect(new URL(`/hesap/giris?hata=${anahtar}`, kok));
  cevap.cookies.delete(DURUM_COOKIE);
  return cevap;
}

/**
 * "Google ile devam et" — 2. adım: Google'ın geri dönüşü.
 *
 * Sırayla: durum çerezi okunur, `state` karşılaştırılır, yetki kodu kimlik
 * belirtecine çevrilir, kimlik hesaba bağlanır ve oturum açılır.
 */
export async function GET(istek: NextRequest) {
  const adres = new URL(istek.url);
  // Kök vekil basliklarindan; istek.url dogrudan 127.0.0.1:3000 gosteriyor.
  const kok = siteKoku(istek);

  if (adres.searchParams.get("error")) {
    // Kullanıcı Google ekranında vazgeçti — bu bir hata değil, sessizce dön.
    const cevap = NextResponse.redirect(new URL("/hesap/giris", kok));
    cevap.cookies.delete(DURUM_COOKIE);
    return cevap;
  }

  const cerez = istek.cookies.get(DURUM_COOKIE)?.value;
  if (!cerez) return hataylaDon(kok, "google-durum");

  let yuk: DurumYuku;
  try {
    yuk = JSON.parse(cerez) as DurumYuku;
  } catch {
    return hataylaDon(kok, "google-durum");
  }

  const gelenDurum = adres.searchParams.get("state") ?? "";
  const kod = adres.searchParams.get("code") ?? "";
  if (!kod || !yuk.durum || !esitMi(gelenDurum, yuk.durum)) {
    return hataylaDon(kok, "google-durum");
  }

  /*
   * Dönüş yolu ÇEREZDEN geliyor ama yine de denetleniyor: çerez bizim
   * yazdığımız bir değer olsa da, savunmayı tek bir noktaya bırakmamak için
   * açık yönlendirme kontrolü burada tekrarlanıyor.
   */
  const donus = yuk.donus?.startsWith("/") && !yuk.donus.startsWith("//") ? yuk.donus : "";

  const kimlikSonucu = await kimligiAl(istek, kod, yuk.nonce);
  if (!kimlikSonucu.basarili) return hataylaDon(kok, "google-dogrulama");

  /*
   * Yönetici hesabı BİLEREK dışarıda: yetkisi ortam değişkenindeki parolaya
   * bağlı. Google ile girilebilseydi, o adrese ait bir Google hesabını ele
   * geçiren kişi ADMIN_PASSWORD'ü hiç bilmeden panele girerdi.
   */
  if (adminMi(kimlikSonucu.kimlik.eposta)) {
    return hataylaDon(kok, "google-yonetici");
  }

  const hesapSonucu = await googleHesabiCoz(kimlikSonucu.kimlik);
  if (!hesapSonucu.basarili) return hataylaDon(kok, "google-hesap");

  const { hesap } = hesapSonucu.veri;
  await oturumAc({
    eposta: hesap.eposta,
    ad: hesap.ad,
    rol: hesap.rol,
    restoranSlug: hesap.restoranSlug,
  });

  const hedef = donus || rolAnaSayfasi(hesap.rol);
  const cevap = NextResponse.redirect(new URL(hedef, kok));
  cevap.cookies.delete(DURUM_COOKIE);
  return cevap;
}
