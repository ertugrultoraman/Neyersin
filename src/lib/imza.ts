import crypto from "node:crypto";

/**
 * İMZA İLKELLERİ — durum tutmayan (stateless) jetonların ortak tabanı.
 *
 * Hem web oturum çerezi (`lib/oturum.ts`) hem mobil erişim jetonu
 * (`lib/mobil/jeton.ts`) aynı şemayı kullanıyor: `base64url(JSON).imza`.
 * Kod iki yerde ayrı ayrı yazılmıştı; güvenliğin kalbindeki bir mantığın
 * kopyalanması, birinde düzeltilen bir hatanın diğerinde yaşamaya devam
 * etmesi demek. Tek uygulama burada duruyor.
 *
 * DİKKAT: `src/middleware.ts` bu şemanın Web Crypto ile yazılmış ÜÇÜNCÜ bir
 * kopyasını içeriyor — ara katman Node API'lerine erişemediği için mecburen.
 * Buradaki imzalama ya da anahtar türetme değişirse orası da değişmeli.
 */

export function b64url(veri: string | Buffer): string {
  return Buffer.from(veri).toString("base64url");
}

export function hmacImzala(yuk: string, anahtar: string): string {
  return crypto.createHmac("sha256", anahtar).update(yuk).digest("base64url");
}

/**
 * Sabit zamanlı karşılaştırma — imza doğrulaması ölçülerek kırılmasın.
 *
 * `timingSafeEqual` uzunlukları farklı olan tamponlarda İSTİSNA ATIYOR, bu
 * yüzden uzunluk önce ayrıca kontrol ediliyor. Uzunluk sızıyor ama imza
 * uzunluğu zaten sabit; sızan bir bilgi yok.
 */
export function sabitZamanliEsit(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Nesneyi imzalı jetona çevirir. */
export function jetonPaketle(yuk: unknown, anahtar: string): string {
  const kodlu = b64url(JSON.stringify(yuk));
  return `${kodlu}.${hmacImzala(kodlu, anahtar)}`;
}

/**
 * Jetonu açar. İmza tutmuyorsa ya da gövde bozuksa `null`.
 *
 * SÜRE KONTROLÜ BURADA YOK: her jeton türünün süre alanı farklı adlanıyor
 * (web `bitis`, mobil `sonKullanma`) ve süresi dolmuş jetona ne yapılacağı da
 * farklı (çerez düşer, mobil yenileme jetonuyla tazeler). Çağıran taraf karar
 * versin diye ham gövde dönülüyor.
 */
export function jetonAc<T>(jeton: string, anahtar: string): T | null {
  const parcalar = jeton.split(".");
  if (parcalar.length !== 2) return null;

  const [kodlu, imza] = parcalar;
  if (!sabitZamanliEsit(imza, hmacImzala(kodlu, anahtar))) return null;

  try {
    return JSON.parse(Buffer.from(kodlu, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Bir ana sırdan, amaca özel ALT ANAHTAR türetir.
 *
 * Neden: web çerezi ve mobil jetonu aynı anahtarla imzalansaydı, birinden
 * sızan bir jeton diğerinde de geçerli olurdu. Alan adı ("ny-oturum",
 * "ny-mobil-erisim"…) özete karıştığı için her amacın anahtarı ayrı çıkıyor
 * ve jetonlar birbirinin yerine kullanılamıyor.
 */
export function alanAnahtari(alan: string, anaSir: string): string {
  return crypto.createHash("sha256").update(`${alan}:${anaSir}`).digest("hex");
}
