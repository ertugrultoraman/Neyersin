/**
 * DİL DESTEĞİ — Türkçe ve İngilizce (SAF parça).
 *
 * Burada `next/headers` gibi yalnızca sunucuda çalışan hiçbir şey OLMAMALI:
 * bu dosya istemci bileşenlerinden de içeri alınıyor ve sunucuya özel bir
 * içe aktarma tarayıcı paketinin derlenmesini bozuyor. Çerezi okuyan
 * `aktifDil` bu yüzden `dil-sunucu.ts` içinde.
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

export const DIL_ETIKETLERI: Record<Dil, string> = {
  tr: "TR",
  en: "EN",
};
