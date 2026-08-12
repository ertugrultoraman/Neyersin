import { hesapDepoAl } from "../hesaplar";
import type { OturumBilgisi } from "./jeton";
import type { KullaniciDto } from "./tipler";

/**
 * Oturum bilgisini uygulamaya gönderilecek kullanıcı nesnesine çevirir.
 *
 * Jetonun İÇİNDEKİ bilgi yetmiyor: profil fotoğrafı, telefon ve e-posta
 * doğrulama durumu jetona yazılmıyor (her istekte taşınacak kadar önemli
 * değiller ve değiştiklerinde jeton eskir). Bu yüzden hesap kaydı
 * veritabanından okunuyor.
 *
 * YÖNETİCİNİN VERİTABANINDA KAYDI YOK — `ADMIN_EMAILS` listesiyle ve
 * `ADMIN_PASSWORD` ile giriyor (bkz. lib/oturum.ts). `hesapBul` onun için
 * null döner; o durumda jetondaki bilgiyle yetiniliyor. Bu satır olmasaydı
 * yönetici mobil uygulamada "hesabınız bulunamadı" görürdü.
 */
export async function kullaniciDto(bilgi: OturumBilgisi): Promise<KullaniciDto> {
  const depo = await hesapDepoAl();
  const hesap = await depo.hesapBul(bilgi.eposta);

  return {
    eposta: bilgi.eposta,
    ad: hesap?.ad ?? bilgi.ad,
    rol: bilgi.rol,
    restoranSlug: bilgi.restoranSlug,
    isletmeYetkisi: bilgi.isletmeYetkisi,
    epostaDogrulandi: hesap?.epostaDogrulandi ?? bilgi.rol === "admin",
    fotografUrl: hesap?.fotografUrl,
    telefon: hesap?.telefon,
  };
}

/**
 * Cihaz kimliğini temizler.
 *
 * Uygulama bunu kendisi üretiyor (UUID) ama gövde dışarıdan geliyor; sınırsız
 * uzunlukta bir dizge push jetonu tablosuna olduğu gibi yazılacaktı.
 */
export function cihazTemizle(ham: unknown): string | null {
  if (typeof ham !== "string") return null;
  const temiz = ham.trim().slice(0, 100);
  return temiz.length >= 8 ? temiz : null;
}
