import { Linking, Platform } from "react-native";

/**
 * TELEFON VE HARİTA — cihazın kendi uygulamalarına devrediliyor.
 *
 * Uygulamanın içine gömülü harita YOK ve bu bilinçli: Google Maps anahtarı
 * henüz alınmadı, alınsa bile kuryenin gerçekte kullandığı şey navigasyon
 * uygulamasının sesli yönlendirmesi. Kendi haritamızda bir pin göstermek,
 * kuryeyi yine de Yandex/Google'a geçmeye zorlardı — bir dokunuş fazladan.
 *
 * Bu yüzden burada API anahtarı gerektiren hiçbir şey yok; `Linking` yeterli.
 */

/** Kuryenin bastığı hedefin açılmama sebebi — ekran bunu kullanıcıya yazıyor. */
export type BaglantiSonucu = { tamam: true } | { tamam: false; sebep: string };

const BASARILI: BaglantiSonucu = { tamam: true };

async function ac(adres: string, sebep: string): Promise<BaglantiSonucu> {
  try {
    await Linking.openURL(adres);
    return BASARILI;
  } catch {
    return { tamam: false, sebep };
  }
}

/**
 * Telefon uygulamasını numarayla açar (arama BAŞLATMAZ — kullanıcı onaylıyor).
 *
 * Numaradaki boşluk ve parantezler temizleniyor: `tel:` şeması bazı Android
 * çeviricilerinde boşluklu numarayı olduğu gibi kabul etmiyor ve tuş takımı
 * boş açılıyor.
 */
export function ara(telefon: string): Promise<BaglantiSonucu> {
  const temiz = telefon.replace(/[^\d+]/g, "");
  if (!temiz) return Promise.resolve({ tamam: false, sebep: "Kayıtlı bir telefon numarası yok." });
  return ac(`tel:${temiz}`, "Telefon uygulaması açılamadı.");
}

/**
 * Adresi cihazın harita uygulamasında arar.
 *
 * KOORDİNAT DEĞİL METİN gönderiliyor: siparişteki adres serbest metin (mahalle,
 * cadde, bina no) ve sunucuda geokodlanmıyor. Metin araması, yanlış bir
 * koordinata pin atmaktan iyi — kurye sonucu görüp doğru olanı seçiyor.
 */
export async function haritadaAc(adres: string): Promise<BaglantiSonucu> {
  const sorgu = encodeURIComponent(adres.trim());
  if (!sorgu) return { tamam: false, sebep: "Gösterilecek bir adres yok." };

  const yerel = Platform.OS === "ios" ? `maps://?q=${sorgu}` : `geo:0,0?q=${sorgu}`;
  const yerelSonuc = await ac(yerel, "");
  if (yerelSonuc.tamam) return yerelSonuc;

  /*
   * Yerel şema açılmadı: cihazda harita uygulaması olmayabilir (bazı Android
   * ROM'ları) ya da web'de çalışıyoruz. Tarayıcı her yerde var.
   */
  return ac(
    `https://www.google.com/maps/search/?api=1&query=${sorgu}`,
    "Harita açılamadı.",
  );
}
