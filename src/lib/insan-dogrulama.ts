import crypto from "node:crypto";

/**
 * "Ben robot değilim" — kendi altyapımızla, üçüncü taraf olmadan.
 *
 * NEDEN reCAPTCHA / hCaptcha DEĞİL: ikisi de sayfaya dış betik yüklüyor,
 * ziyaretçiyi Google'a tanıtıyor ve sıkı CSP'mizi (`script-src 'self'`)
 * gevşetmeyi gerektiriyor. Bu çözüm hiçbir dış istek yapmıyor.
 *
 * NE KADAR KORUR — dürüst cevap:
 *  - Basit kazıyıcıları, form botlarını ve "sayfayı çek, linkleri topla"
 *    türü trafiği keser. Bunlar botların büyük çoğunluğu.
 *  - Gerçek tarayıcı sürücüsü (Playwright/Puppeteer) kullanan HEDEFLİ bir
 *    saldırganı durdurmaz. Onun için Cloudflare Turnstile gibi bir servis
 *    gerekir; altyapı buna hazır — `dogrulamaGecerliMi` tek kapı.
 *
 * Nasıl çalışır: kişi kutuyu işaretleyince sunucu HMAC imzalı bir bilet
 * üretip çereze yazıyor. Bilet süre içeriyor, kurcalanamıyor ve
 * `GECERLILIK_GUN` boyunca geçerli — her ziyarette tekrar sorulmuyor.
 */

export const DOGRULAMA_COOKIE = "ny_insan";
export const GECERLILIK_GUN = 2;

/** Bot, formu insandan çok daha hızlı gönderir. Altındaki süre şüpheli. */
const ASGARI_SURE_MS = 900;

function anahtar(): string {
  const gizli = process.env.OTURUM_ANAHTARI ?? process.env.ADMIN_PASSWORD;
  if (gizli) return gizli;
  /*
   * Yapılandırma yoksa süreç ömrü boyunca sabit rastgele anahtar: biletler
   * yeniden başlatmada düşer ama ASLA tahmin edilemez. Oturum modülüyle aynı
   * yaklaşım (bkz. lib/oturum.ts).
   */
  return GECICI_ANAHTAR;
}
const GECICI_ANAHTAR = crypto.randomBytes(32).toString("hex");

function imzala(yuk: string): string {
  return crypto.createHmac("sha256", anahtar()).update(yuk).digest("base64url");
}

/** `bitis.imza` biçiminde bilet üretir. */
export function biletUret(): string {
  const bitis = String(Date.now() + GECERLILIK_GUN * 24 * 60 * 60 * 1000);
  return `${bitis}.${imzala(bitis)}`;
}

/** Bileti doğrular: imza tutuyor mu ve süresi geçmemiş mi? */
export function biletGecerliMi(bilet: string | undefined | null): boolean {
  if (!bilet) return false;
  const [bitis, imza] = bilet.split(".");
  if (!bitis || !imza) return false;

  const beklenen = imzala(bitis);
  const a = Buffer.from(imza);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  const zaman = Number(bitis);
  if (!Number.isFinite(zaman)) return false;

  const simdi = Date.now();
  if (zaman <= simdi) return false;

  /*
   * Süre KISALTILDIĞINDA eski biletler de düşsün.
   *
   * Bitiş tarihi biletin içine yazıldığı için, süreyi 30 günden 2 güne
   * indirmek tek başına yetmiyordu: daha önce verilmiş 30 günlük biletler
   * kendi tarihlerine kadar geçerli kalıyor, değişiklik ancak bir ay sonra
   * herkeste yürürlüğe giriyordu. İzin verilenden UZAK bir bitiş tarihi
   * taşıyan bilet artık geçersiz sayılıyor.
   */
  const azamiOmur = GECERLILIK_GUN * 24 * 60 * 60 * 1000;
  return zaman - simdi <= azamiOmur;
}

/**
 * Arama motoru tarayıcıları kapıdan MUAF.
 *
 * Muaf tutulmasaydı Google ve Bing siteyi tarayamaz, sitede hiçbir sayfa
 * aranınca çıkmazdı — yemek sipariş sitesi için bu, kapıyı kapatmakla eşdeğer.
 * User-agent taklit edilebilir; ama bu kapının amacı zaten hedefli saldırgan
 * değil, sıradan bot trafiği (bkz. dosya başındaki not). Bilinçli bir tercih.
 */
const TARAYICI_BOTLARI =
  /(googlebot|bingbot|slurp|duckduckbot|yandexbot|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot)/i;

export function aramaMotoruMu(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && TARAYICI_BOTLARI.test(userAgent));
}

/**
 * Hata SÖZLÜK ANAHTARI olarak dönüyor, hazır cümle olarak değil.
 *
 * Bu dosya saf tutulmalı (`node:crypto` dışında bağımlılığı yok, testler de
 * doğrudan okuyor); burada `next/headers` çağırıp dili öğrenemez. Anahtarı
 * çağıran sunucu eylemi çeviriyor.
 */
export type DogrulamaSonucu = { gecerli: true } | { gecerli: false; hata: string };

/**
 * Formdan gelen kanıtları denetler.
 *
 * İki tuzak var:
 *  1. Bal küpü (honeypot): ekranda görünmeyen bir alan. İnsan dolduramaz;
 *     formu otomatik dolduran bot doldurur.
 *  2. Süre: form açıldığı an damgalanır. Bir saniyeden kısa sürede gönderilen
 *     form insan eli değildir.
 */
export function girdiyiDenetle(girdi: {
  isaretli: boolean;
  balKupu: string;
  acilisZamani: string;
}): DogrulamaSonucu {
  if (girdi.balKupu.trim() !== "") {
    return { gecerli: false, hata: "insanKapisi.dogrulamaBasarisiz" };
  }
  if (!girdi.isaretli) {
    return { gecerli: false, hata: "insanKapisi.kutuyuIsaretle" };
  }

  const acilis = Number(girdi.acilisZamani);
  if (!Number.isFinite(acilis) || Date.now() - acilis < ASGARI_SURE_MS) {
    return { gecerli: false, hata: "insanKapisi.dogrulamaBasarisiz" };
  }

  return { gecerli: true };
}
