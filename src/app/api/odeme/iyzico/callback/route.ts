import { NextResponse, type NextRequest } from "next/server";

import { depoAl } from "@/lib/depo";
import { odemeSonucuAl } from "@/lib/iyzico";
import { odemeSonucuKaydet } from "@/lib/siparis-deposu";
import { siparisOzetiGonder } from "@/lib/siparis-postasi";

/** iyzipay SDK Node çalışma zamanı gerektirir (node:crypto, node:https). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico, ödeme tamamlandığında (başarılı ya da başarısız) buraya form-encoded
 * bir POST atar. Gövdedeki `token` dışında hiçbir bilgiye GÜVENİLMEZ:
 * ödemenin gerçekten alındığı, token ile iyzico'ya sorulup yanıtın HMAC imzası
 * doğrulanarak teyit edilir (bkz. lib/iyzico.ts).
 */
export async function POST(istek: NextRequest) {
  let token = "";

  try {
    const govde = await istek.formData();
    token = String(govde.get("token") ?? "");
  } catch {
    // form-encoded değilse JSON dene
    try {
      const json = (await istek.json()) as { token?: string };
      token = json.token ?? "";
    } catch {
      token = "";
    }
  }

  if (!token) {
    console.error("[iyzico callback] token yok");
    return yonlendir(istek, { durum: "basarisiz", mesaj: "Ödeme bilgisi alınamadı." });
  }

  const sonuc = await odemeSonucuAl(token);

  if (sonuc.durum === "basarili") {
    await odemeSonucuKaydet({
      siparisNo: sonuc.siparisNo,
      odemeYontemi: "iyzico",
      durum: "odendi",
      saglayiciOdemeId: sonuc.paymentId,
      odenenTutar: sonuc.odenenTutar,
    });

    /*
     * ÖZET POSTASI ÖDEME ONAYINDAN SONRA. Sipariş oluşturulurken gönderilseydi,
     * yarıda bırakılan ya da reddedilen her kart denemesi için "siparişin
     * alındı" postası gitmiş olurdu. Kapıda ödemede sipariş oluştuğu an
     * kesinleştiği için orada oluşturma anında gönderiliyor
     * (bkz. lib/siparis-olustur.ts).
     *
     * Beklenmiyor: iyzico bu isteğin cevabını bekliyor ve SMTP yavaşlığı
     * yüzünden zaman aşımına düşerse ödeme dönüşü kaybolurdu. Sipariş zaten
     * kaydedildi; posta arka planda gidiyor ve kendi hatasını yutuyor.
     */
    void (async () => {
      const siparis = await (await depoAl()).bul(sonuc.siparisNo);
      if (siparis) await siparisOzetiGonder(siparis);
    })().catch(() => {});

    return yonlendir(istek, { durum: "basarili", no: sonuc.siparisNo });
  }

  await odemeSonucuKaydet({
    siparisNo: sonuc.siparisNo ?? "-",
    odemeYontemi: "iyzico",
    durum: "odeme-basarisiz",
    mesaj: sonuc.mesaj,
  });

  return yonlendir(istek, {
    durum: "basarisiz",
    no: sonuc.siparisNo,
    mesaj: sonuc.mesaj,
  });
}

/**
 * Sonuç sayfasına 303 ile yönlendirir — POST'tan sonra GET'e geçmek için
 * doğru durum kodu (307/308 metodu korur, kullanıcı sayfayı yenilerse
 * tekrar POST gönderilir).
 */
function yonlendir(
  istek: NextRequest,
  parametreler: { durum: "basarili" | "basarisiz"; no?: string; mesaj?: string },
) {
  const hedef = new URL("/siparis/sonuc", istek.nextUrl.origin);
  hedef.searchParams.set("durum", parametreler.durum);
  if (parametreler.no) hedef.searchParams.set("no", parametreler.no);
  if (parametreler.mesaj) hedef.searchParams.set("mesaj", parametreler.mesaj);
  return NextResponse.redirect(hedef, 303);
}

/** Kullanıcı adresi elle açarsa boş sonuç sayfasına gönder. */
export async function GET(istek: NextRequest) {
  return yonlendir(istek, { durum: "basarisiz", mesaj: "Geçersiz ödeme dönüşü." });
}
