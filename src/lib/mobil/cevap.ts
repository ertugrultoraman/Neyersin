import { NextResponse } from "next/server";

/**
 * MOBİL API CEVAP ZARFI.
 *
 * Her uç aynı biçimi dönüyor; istemci tarafında tek bir çözümleyici yeterli
 * oluyor (bkz. packages/ortak/src/api/istemci.ts). Zarf olmasaydı her uç için
 * "bu 200 mü döndü yoksa hata nesnesi mi" kontrolü ayrı yazılırdı.
 *
 *   Başarı:  { "tamam": true,  "veri": … }
 *   Hata:    { "tamam": false, "hata": { "kod": "…", "mesaj": "…" } }
 *
 * `kod` MAKİNE için, `mesaj` İNSAN için. İstemci akış kararlarını koda göre
 * veriyor (ör. `oturum_gecersiz` → jetonu tazele), kullanıcıya mesajı
 * gösteriyor. Mesaja göre dallanmak, metin her düzeltildiğinde uygulamayı
 * bozardı.
 */

/** İstemcinin davranış değiştirdiği hata kodları — istemci tarafıyla ortak sözleşme. */
export type HataKodu =
  /** Jeton yok, bozuk ya da süresi dolmuş → yenileme jetonuyla tazele. */
  | "oturum_gecersiz"
  /** Kimlik doğru ama bu işlem için yetki yok → kullanıcıya söyle, tazeleme. */
  | "yetki_yok"
  | "bulunamadi"
  /** Girdi doğrulaması düştü; `alanlar` doluysa form altına yazılır. */
  | "gecersiz_istek"
  | "cok_fazla_istek"
  /**
   * Sistem bakımda (503). Bu kodu route handler'lar DEĞİL, `src/middleware.ts`
   * üretiyor — istek uçlara hiç ulaşmadan kesiliyor. Uygulama bunu görünce
   * hata ekranı değil "bakımdayız" ekranı gösteriyor.
   */
  | "bakimda"
  | "sunucu_hatasi";

export type BasariliCevap<T> = { tamam: true; veri: T };
export type HataliCevap = {
  tamam: false;
  hata: {
    kod: HataKodu;
    mesaj: string;
    /** Alan bazlı doğrulama hataları — `siparisDogrula` çıktısı buraya düşüyor. */
    alanlar?: Record<string, string>;
  };
};

export function basarili<T>(veri: T, durum = 200): NextResponse<BasariliCevap<T>> {
  return NextResponse.json(
    { tamam: true as const, veri },
    {
      status: durum,
      /*
       * Mobil cevaplar ASLA önbelleğe alınmıyor. Vercel'in kenar önbelleği
       * `Authorization` başlığına bakmadığı için, bir kullanıcının siparişleri
       * bir başkasına servis edilebilirdi.
       */
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export function hata(
  kod: HataKodu,
  mesaj: string,
  durum: number,
  alanlar?: Record<string, string>,
): NextResponse<HataliCevap> {
  return NextResponse.json(
    { tamam: false as const, hata: { kod, mesaj, ...(alanlar ? { alanlar } : {}) } },
    { status: durum, headers: { "Cache-Control": "no-store" } },
  );
}

/* --- Sık kullanılan kısayollar ----------------------------------------- */

export const yetkisiz = (mesaj = "Oturumunuzun süresi doldu.") =>
  hata("oturum_gecersiz", mesaj, 401);

export const yasak = (mesaj = "Bu işlem için yetkiniz yok.") => hata("yetki_yok", mesaj, 403);

export const bulunamadi = (mesaj = "Kayıt bulunamadı.") => hata("bulunamadi", mesaj, 404);

export const gecersiz = (mesaj = "Gönderilen bilgiler geçersiz.", alanlar?: Record<string, string>) =>
  hata("gecersiz_istek", mesaj, 400, alanlar);

export const sunucuHatasi = (mesaj = "Beklenmeyen bir hata oluştu.") =>
  hata("sunucu_hatasi", mesaj, 500);

/**
 * Gövdeyi JSON olarak okur; bozuksa `null`.
 *
 * `await istek.json()` bozuk gövdede İSTİSNA ATIYOR ve yakalanmazsa uç 500
 * dönüyor — oysa bu istemcinin hatası, 400 olmalı.
 */
export async function govdeOku<T>(istek: Request): Promise<T | null> {
  try {
    return (await istek.json()) as T;
  } catch {
    return null;
  }
}
