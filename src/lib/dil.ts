import { cookies } from "next/headers";

/**
 * DİL DESTEĞİ — Türkçe ve İngilizce.
 *
 * Beylikdüzü'nde turist müşteri de var; "Sepete ekle" yazısını okuyamayan
 * kişi sipariş veremiyor. Site varsayılan olarak Türkçe açılıyor, isteyen
 * başlıktaki düğmeden İngilizceye geçiyor ve seçim çerezde kalıyor.
 *
 * NEDEN ADRESTE DEĞİL (/en/... gibi):
 * Adres tabanlı dil, 35 sayfanın tamamını `[dil]` klasörüne taşımayı
 * gerektiriyordu — büyük bir yeniden yapılandırma ve her sayfada bozulma
 * riski. Çerez yaklaşımı aynı sonucu çok daha az riskle veriyor. İleride
 * arama motorlarında ayrı İngilizce sayfa gerekirse adres tabanlısına
 * geçilebilir; sözlük olduğu gibi kullanılır.
 */
export const DILLER = ["tr", "en"] as const;
export type Dil = (typeof DILLER)[number];

export const VARSAYILAN_DIL: Dil = "tr";
export const DIL_COOKIE = "ny_dil";
/** Seçim uzun sürsün — her ziyarette tekrar sorulmasın. */
export const DIL_GUN = 365;

export function dilGecerliMi(deger: string | undefined | null): deger is Dil {
  return typeof deger === "string" && (DILLER as readonly string[]).includes(deger);
}

/**
 * Sunucu bileşenlerinde geçerli dil.
 *
 * Çerez yoksa Türkçe. Tarayıcı dilini otomatik algılamıyoruz: Türkiye'den
 * giren çoğu kişinin tarayıcısı İngilizce olabiliyor ve site birden
 * İngilizce açılınca kafa karıştırıyordu.
 */
export async function aktifDil(): Promise<Dil> {
  const deger = (await cookies()).get(DIL_COOKIE)?.value;
  return dilGecerliMi(deger) ? deger : VARSAYILAN_DIL;
}

export const DIL_ETIKETLERI: Record<Dil, string> = {
  tr: "TR",
  en: "EN",
};
