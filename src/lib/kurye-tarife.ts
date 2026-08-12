/**
 * KURYE TARİFESİ — teslimat başına hakediş.
 *
 * TEK KAYNAK BURASI. Tutar hem teklif kartında ("bu iş sana ne kazandırır"),
 * hem özet ekranındaki kazançta, hem de yönetici panelinde aynı fonksiyondan
 * okunuyor. İki yerde hesaplansaydı kurye teklifte gördüğü rakamı ay sonunda
 * bulamaz ve bu, güvenilirliği en hızlı kaybettiren hata türü olurdu.
 *
 * ⚠ AŞAĞIDAKİ TUTARLAR BAŞLANGIÇ DEĞERLERİDİR ve işletme kararıyla
 * belirlenmelidir. Uydurulmuş bir "kazanç" göstergesi değil, sistemin
 * ihtiyaç duyduğu bir iş kuralı: teklif ekranında bir tutar YAZMAK zorunda
 * ve o tutarın ödenecek tutarla aynı olması gerekiyor. Değiştirmek için
 * yalnızca bu dosya yeterli.
 *
 * MESAFE NEDEN YOK: siparişteki adres serbest metin (mahalle, cadde, bina no)
 * ve hiçbir yerde koordinata çevrilmiyor. Mesafe katsayısı eklemek, olmayan
 * bir veriden tutar üretmek olurdu. Geokodlama geldiğinde `mesafeKm`
 * parametresi buraya eklenecek — çağıranlar değişmeyecek.
 */

export type Tarife = {
  /** Her teslimatta ödenen taban tutar (TL). */
  taban: number;
  /**
   * Kapıda ödemeli siparişte ek (TL). Kurye nakit taşıyor, mutabakat
   * sorumluluğu alıyor ve kapıda para üstü çıkarmakla uğraşıyor.
   */
  kapidaOdemeEki: number;
  /** Gece vardiyası eki (TL). */
  geceEki: number;
  /** Gece ekinin başladığı saat (dahil) ve bittiği saat (hariç). */
  geceBaslangicSaati: number;
  geceBitisSaati: number;
};

export const TARIFE: Tarife = {
  taban: 35,
  kapidaOdemeEki: 5,
  geceEki: 10,
  geceBaslangicSaati: 22,
  geceBitisSaati: 6,
};

/** Verilen saat gece tarifesine giriyor mu? (22:00–06:00 gibi gün aşan aralık.) */
export function geceMi(tarih: Date, tarife: Tarife = TARIFE): boolean {
  const saat = tarih.getHours();
  /*
   * Aralık gece yarısını aşıyor; tek bir `>=` && `<` karşılaştırması yanlış
   * sonuç verirdi (22 >= 22 && 22 < 6 → false). Aşan aralıkta koşul VEYA olur.
   */
  return tarife.geceBaslangicSaati > tarife.geceBitisSaati
    ? saat >= tarife.geceBaslangicSaati || saat < tarife.geceBitisSaati
    : saat >= tarife.geceBaslangicSaati && saat < tarife.geceBitisSaati;
}

export type UcretDokumu = {
  taban: number;
  kapidaOdeme: number;
  gece: number;
  toplam: number;
};

/**
 * Bir teslimatın hakedişi ve kalemleri.
 *
 * Dökümü de dönüyor çünkü teklif kartında "3,70 € extra dahil" gibi bir
 * satır gösteriliyor: kurye tutarın neden yüksek olduğunu görmezse ekleri
 * hiç fark etmez ve tarife değişikliği ona ulaşmaz.
 */
export function teslimatHakedisi(
  girdi: { kapidaOdeme: boolean; tarih?: Date },
  tarife: Tarife = TARIFE,
): UcretDokumu {
  const kapidaOdeme = girdi.kapidaOdeme ? tarife.kapidaOdemeEki : 0;
  const gece = geceMi(girdi.tarih ?? new Date(), tarife) ? tarife.geceEki : 0;

  return {
    taban: tarife.taban,
    kapidaOdeme,
    gece,
    toplam: tarife.taban + kapidaOdeme + gece,
  };
}
