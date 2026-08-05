/**
 * BAŞVURU BELGELERİ — resmî evrak yükleme kuralları.
 *
 * Şef ve ev hanımı başvurularında Tarım ve Orman Bakanlığı belgeleri,
 * işletme başvurularında ruhsat/sertifika isteniyor. Bu dosya SAF: yalnızca
 * "hangi dosya kabul edilir" kuralını tutuyor ve hem tarayıcıdaki form hem de
 * sunucu eylemi AYNI kuralı kullanıyor.
 *
 * NEREDE SAKLANIYOR: veritabanında (bkz. hesaplar/postgres.ts `belgeler`).
 * Vercel Blob bilerek kullanılmadı — Blob yalnızca herkese açık erişim
 * sunuyor ve bunlar kimlik/ruhsat belgeleri. Aynı gerekçe sipariş kayıtları
 * için de yazılmıştı (bkz. lib/siparis-deposu.ts).
 */

/** Kabul edilen türler — belge ya PDF'tir ya da belgenin fotoğrafı. */
export const IZINLI_TURLER = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

/** Dosya seçicide gösterilecek süzgeç. */
export const DOSYA_KABUL = ".pdf,.jpg,.jpeg,.png,.webp,.heic";

/** Tek dosya için üst sınır. */
export const AZAMI_BOYUT = 5 * 1024 * 1024;

/** Bir başvuruya eklenebilecek en fazla belge. */
export const AZAMI_ADET = 5;

export type BelgeDenetimi = { gecerli: true } | { gecerli: false; sebep: string };

/**
 * Tek bir dosyayı denetler.
 *
 * Hata SÖZLÜK ANAHTARI olarak dönüyor: bu dosya saf tutulmalı, `next/headers`
 * çağırıp dili öğrenemez (aynı yaklaşım: lib/insan-dogrulama.ts).
 */
export function belgeyiDenetle(dosya: { type: string; size: number; name: string }): BelgeDenetimi {
  if (dosya.size === 0) return { gecerli: false, sebep: "belge.bos" };
  if (dosya.size > AZAMI_BOYUT) return { gecerli: false, sebep: "belge.buyuk" };
  /*
   * Tür hem MIME hem UZANTIDAN denetleniyor. Bazı tarayıcılar HEIC ve
   * bilinmeyen türlerde boş MIME gönderiyor; yalnızca MIME'a bakmak geçerli
   * belgeleri reddediyordu. Yalnızca uzantıya bakmak da yetmez, ikisi birden.
   */
  const uzanti = dosya.name.toLowerCase().split(".").pop() ?? "";
  const uzantiTamam = ["pdf", "jpg", "jpeg", "png", "webp", "heic"].includes(uzanti);
  const mimeTamam = (IZINLI_TURLER as readonly string[]).includes(dosya.type);
  if (!uzantiTamam || (dosya.type && !mimeTamam)) {
    return { gecerli: false, sebep: "belge.tur" };
  }
  return { gecerli: true };
}

/** Okunabilir dosya boyutu — "1,4 MB". */
export function boyutYaz(bayt: number, dil: "tr" | "en" = "tr"): string {
  const mb = bayt / (1024 * 1024);
  if (mb >= 1) return `${mb.toLocaleString(dil === "en" ? "en-GB" : "tr-TR", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bayt / 1024))} KB`;
}

/** Belgenin hangi kayda ait olduğu. */
export type BelgeSahibi = "basvuru" | "iletisim" | "altin-sef";
