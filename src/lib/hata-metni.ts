import { VARSAYILAN_DIL } from "./dil";
import { aktifDil } from "./dil-sunucu";
import { ceviri } from "./sozluk";

/**
 * Sunucu tarafındaki hata metinlerini seçilen dile çevirir.
 *
 * Sunucu eylemleri (server actions) çerezlere erişebildiği için dili doğrudan
 * okuyup mesajı ÇEVRİLMİŞ hâlde döndürüyoruz. Alternatif, anahtarı döndürüp
 * istemcide çevirmekti; o zaman bütün çağrı yerlerinin de değişmesi
 * gerekiyordu.
 *
 * Turist yanlış parola girdiğinde Türkçe bir cümleyle karşılaşmasın diye var.
 *
 * İSTEK BAĞLAMI DIŞINDA DA ÇALIŞIR: `cookies()` yalnızca bir istek işlenirken
 * kullanılabiliyor. Bu doğrulamalar bakım betiklerinden ve göçlerden de
 * çağrılabildiği için hata yutulup Türkçeye düşülüyor; aksi hâlde geçerli bir
 * doğrulama mesajı yerine çalışma zamanı hatası fırlardı.
 */
export async function hataMetni(
  anahtar: string,
  degiskenler?: Record<string, string | number>,
): Promise<string> {
  try {
    return ceviri(await aktifDil())(anahtar, degiskenler);
  } catch {
    return ceviri(VARSAYILAN_DIL)(anahtar, degiskenler);
  }
}
