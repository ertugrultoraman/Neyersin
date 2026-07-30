/**
 * Ödeme yapılandırması.
 *
 * İki yöntem destekleniyor:
 *  - `havale`: Havale / EFT. Her zaman açık, altyapı gerektirmez.
 *  - `iyzico`: Kredi / banka kartı, iyzico Checkout Form ile. Yalnızca
 *    IYZICO_API_KEY ve IYZICO_SECRET_KEY tanımlıysa arayüzde görünür.
 *
 * Kullanılabilir yöntemler sunucuda hesaplanıp sayfaya prop olarak geçilir —
 * istemci ortam değişkenlerini okuyamaz.
 */

export type OdemeYontemi = "havale" | "iyzico";

export type BankaHesabi = {
  banka: string;
  unvan: string;
  iban: string;
  /** true ise arayüzde uyarı çıkar — canlıya çıkmadan gerçek bilgi girilmeli. */
  ornekMi?: boolean;
};

export const havale = {
  yontemAdi: "Havale / EFT",
  aciklama: "Sipariş numaranla IBAN'a ödeme yap. Dekont eşleşince sipariş mutfağa iletilir.",
  /** Ödeme yapılmazsa siparişin otomatik iptal edileceği süre (saat). */
  odemeSuresiSaat: 2,
  /**
   * !! ÖNEMLİ: Aşağıdaki hesap ÖRNEKTİR. `ornekMi: true` olduğu sürece arayüzde
   * "gerçek hesap bilgisiyle değiştirilmeli" uyarısı gösterilir. Gerçek IBAN
   * girildiğinde `ornekMi` alanını kaldırın.
   */
  hesaplar: [
    {
      banka: "Örnek Bankası",
      unvan: "Ne Yersin? Teknoloji A.Ş.",
      iban: "TR00 0000 0000 0000 0000 0000 00",
      ornekMi: true,
    },
  ] as BankaHesabi[],
  aciklamaKurali: "Açıklama alanına yalnızca sipariş numaranızı yazın.",
};

export const kart = {
  yontemAdi: "Kredi / Banka Kartı",
  aciklama: "iyzico güvenli ödeme sayfasında kartınla öde. Kart bilgisi bize ulaşmaz.",
};

/** Geriye dönük uyumluluk için eski `odeme` adı korunuyor. */
export const odeme = havale;

export function havaleYapilandirildiMi(): boolean {
  return havale.hesaplar.length > 0 && havale.hesaplar.every((h) => !h.ornekMi);
}
