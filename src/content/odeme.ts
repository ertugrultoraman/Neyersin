/**
 * Ödeme yapılandırması.
 *
 * Şu an tek ödeme yöntemi HAVALE / EFT. Online kart ödemesi yok — sipariş
 * oluşturulduğunda müşteriye sipariş numarası ve havale talimatı gösterilir,
 * ödeme dekontu ulaşınca sipariş "onaylandı" durumuna alınır.
 *
 * !! ÖNEMLİ: Aşağıdaki hesap ÖRNEKTİR. `ornekMi: true` olduğu sürece arayüzde
 * "gerçek hesap bilgisiyle değiştirilmeli" uyarısı gösterilir. Gerçek IBAN
 * girildiğinde `ornekMi` alanını kaldırın.
 */

export type BankaHesabi = {
  banka: string;
  unvan: string;
  iban: string;
  /** true ise arayüzde uyarı çıkar — canlıya çıkmadan gerçek bilgi girilmeli. */
  ornekMi?: boolean;
};

export const odeme = {
  yontem: "havale" as const,
  yontemAdi: "Havale / EFT",
  /** Ödeme yapılmazsa siparişin otomatik iptal edileceği süre (saat). */
  odemeSuresiSaat: 2,
  hesaplar: [
    {
      banka: "Örnek Bankası",
      unvan: "Ne Yersin? Teknoloji A.Ş.",
      iban: "TR00 0000 0000 0000 0000 0000 00",
      ornekMi: true,
    },
  ] as BankaHesabi[],
  /** Havale açıklamasına yazılması gereken bilgi. */
  aciklamaKurali: "Açıklama alanına yalnızca sipariş numaranızı yazın.",
};

export function odemeYapilandirildiMi(): boolean {
  return odeme.hesaplar.length > 0 && odeme.hesaplar.every((h) => !h.ornekMi);
}
