/**
 * TELEFON MASKELEME — gerçek numarayı göstermeden arama.
 *
 * DURUM: KAPALI. Bu dosya çalışan bir maskeleme YAPMIYOR; bir sağlayıcı
 * bağlandığında takılacak yeri tutuyor ve o güne kadar arayüzün maskesiz
 * numara sızdırmamasını sağlıyor.
 *
 * NEDEN KENDİMİZ YAZAMIYORUZ: numara maskeleme, iki tarafı da bir ARA
 * NUMARA üzerinden bağlamak demek. Bu ara numaraların operatörden kiralanması
 * (Netgsm, Verimor, Bulutfon; yurt dışında Twilio Proxy), aramanın onların
 * santralinde eşleştirilmesi ve Türkiye'de BTK kaydı gerekiyor. Uygulama
 * kodunun tek başına çözebileceği bir şey değil — sözleşme ve numara havuzu
 * işi.
 *
 * O YÜZDEN BUGÜNKÜ ÇÖZÜM MESAJLAŞMA: kurye ile müşteri sipariş üzerinden
 * yazışıyor, telefon hiç devreye girmiyor (bkz. lib/siparis-mesajlari.ts).
 * Gizlilik amacı bugün de karşılanıyor; maskeleme onun yerine değil, YANINA
 * gelecek — kapıda konuşmak gerektiğinde.
 *
 * SAĞLAYICI BAĞLANDIĞINDA yapılacak tek şey `maskeliHatAl` içindeki dalı
 * doldurmak. Arayüz zaten `null` gelen durumu (maskeleme yok → yalnızca
 * mesajlaşma) doğru işliyor, çağıran yerlerin değişmesi gerekmiyor.
 */

/** Maskeleme sağlayıcısı yapılandırıldı mı? */
export function maskelemeAcikMi(): boolean {
  return Boolean(process.env.MASKELEME_SAGLAYICISI?.trim());
}

export type MaskeliHat = {
  /** Aranacak ara numara — iki tarafın da gördüğü, kimseye ait olmayan hat. */
  numara: string;
  /** Sağlayıcı hattı sipariş bazında ayırıyorsa dahili kod. */
  dahili?: string;
  /** Bu hattın geçerliliğinin bittiği an (ISO). */
  bitis: string;
};

/**
 * Bu sipariş için ara numara verir; maskeleme kapalıysa `null`.
 *
 * `null` dönmesi hata DEĞİL, olağan durum: arayüz o zaman yalnızca mesajlaşma
 * gösteriyor. Çağıran taraf asla gerçek numaraya düşmemeli — maskelemenin
 * bütün amacı o.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imza sağlayıcı bağlanınca kullanılacak; çağıran yerler bugünden doğru yazılsın diye duruyor
export async function maskeliHatAl(_girdi: {
  siparisNo: string;
  /** Hattı isteyen taraf; sağlayıcıya hangi yönde bağlanacağı bildiriliyor. */
  taraf: "kurye" | "musteri";
}): Promise<MaskeliHat | null> {
  if (!maskelemeAcikMi()) return null;

  /*
   * Sağlayıcı entegrasyonu buraya gelecek: sipariş için bir oturum açılıp
   * ara numara isteniyor, teslimat bitince kapatılıyor. Yapılandırma var ama
   * kod yoksa numara UYDURULMUYOR — gerçek numaraya düşmektense arama
   * özelliğinin hiç görünmemesi doğru.
   */
  return null;
}
