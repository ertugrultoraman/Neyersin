import { hesapDepoAl, yorumOzetiHesapla } from "@/lib/hesaplar";
import type { Yorum, YorumOzeti } from "@/lib/hesaplar/tipler";

export const BOS_OZET: YorumOzeti = {
  adet: 0,
  ortalama: 0,
  sicaklik: 0,
  teslimatHizi: 0,
  tad: 0,
};

/**
 * Bir mutfağın yorumları ve özeti.
 *
 * Ortalama, yorumların aritmetik ortalamasıdır: önce her eksen (sıcaklık,
 * teslimat hızı, tad) kendi içinde ortalanır, sonra bu üç ortalamanın
 * ortalaması alınır — bkz. `yorumOzetiHesapla`.
 *
 * Depo erişilemezse boş özet döner; sayfa yine açılır, yalnızca değerlendirme
 * bölümü boş görünür.
 */
export async function restoranYorumlari(
  restoranSlug: string,
): Promise<{ yorumlar: Yorum[]; ozet: YorumOzeti }> {
  try {
    const yorumlar = await (await hesapDepoAl()).yorumlariListele(restoranSlug);
    return { yorumlar, ozet: yorumOzetiHesapla(yorumlar) };
  } catch {
    return { yorumlar: [], ozet: BOS_OZET };
  }
}
