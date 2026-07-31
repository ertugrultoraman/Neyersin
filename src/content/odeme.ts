/**
 * Ödeme yapılandırması.
 *
 * İki yöntem destekleniyor:
 *  - `havale`: KAPIDA ödeme — kurye geldiğinde nakit ya da IBAN'a havale.
 *    Her zaman açık, altyapı gerektirmez.
 *  - `iyzico`: Kredi / banka kartı, iyzico Checkout Form ile. Yalnızca
 *    IYZICO_API_KEY ve IYZICO_SECRET_KEY tanımlıysa arayüzde görünür.
 *
 * NOT: `"havale"` anahtarı geçmiş siparişlerin kayıtlarında durduğu için
 * değişmedi; yalnızca müşteriye gösterilen adı ve akışı güncellendi. Ödeme
 * artık peşin değil, teslimat anında alınıyor — bu yüzden "şu kadar saat
 * içinde öde, yoksa iptal" kuralı kaldırıldı.
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
  yontemAdi: "Kapıda Ödeme",
  aciklama: "Kurye geldiğinde nakit ödeyebilir ya da IBAN'a havale yapabilirsin.",
  /** Kapıda seçilebilecek ödeme biçimleri — arayüzde liste olarak gösterilir. */
  kapidaSecenekler: ["Nakit", "IBAN'a havale"],
  hesaplar: [
    {
      banka: "Yapı Kredi",
      unvan: "Mürsel Ertuğrul Toraman",
      iban: "TR66 0006 7010 0000 0011 0346 97",
    },
  ] as BankaHesabi[],
  aciklamaKurali: "Havaleyi seçersen açıklama alanına yalnızca sipariş numaranı yaz.",
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
