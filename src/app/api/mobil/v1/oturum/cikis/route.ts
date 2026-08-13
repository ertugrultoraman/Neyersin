import type { NextRequest } from "next/server";

import { basarili } from "@/lib/mobil/cevap";
import { cihaziIptalEt, tumCihazlariIptalEt } from "@/lib/mobil/cihazlar";
import { korumali } from "@/lib/mobil/koruma";

/**
 * POST /api/mobil/v1/oturum/cikis
 *
 * Oturumu SUNUCU TARAFINDA da kapatır. Uygulama zaten jetonları cihazdan
 * siliyor ama bu tek başına yetmiyordu: yenileme jetonunun ömrü 180 gün ve
 * bir kopyası alınmışsa (yedek, ele geçirilmiş cihaz) silmek onu geçersiz
 * kılmıyor. Burada cihaz iptal ediliyor ve o jetonla bir daha tazeleme
 * yapılamıyor (bkz. oturum/yenile).
 *
 * `?hepsi=1` ile hesabın BÜTÜN cihazları kesiliyor — parolasının sızdığından
 * şüphelenen kişinin ilk yapması gereken şey.
 *
 * ROL KISITI YOK: her rol kendi oturumunu kapatabilmeli.
 *
 * HER ZAMAN BAŞARILI DÖNÜYOR. Çıkış, kullanıcının vazgeçemeyeceği bir işlem;
 * veritabanı susarsa bile uygulama jetonları silip giriş ekranına dönmeli.
 * Hata dönseydi kullanıcı "çıkış yapamıyorum" ekranında kalırdı.
 */
export async function POST(istek: NextRequest) {
  return korumali(istek, { hiz: "yazma" }, async (oturum) => {
    const hepsi = istek.nextUrl.searchParams.get("hepsi") === "1";

    try {
      if (hepsi) {
        const adet = await tumCihazlariIptalEt(oturum.eposta);
        return basarili({ kapatilan: adet });
      }
      await cihaziIptalEt(oturum.eposta, oturum.cihaz);
      return basarili({ kapatilan: 1 });
    } catch {
      return basarili({ kapatilan: 0 });
    }
  });
}
