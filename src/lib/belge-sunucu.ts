import crypto from "node:crypto";

import { AZAMI_ADET, belgeyiDenetle, type BelgeSahibi } from "./belge";
import { hesapDepoAl, type Belge } from "./hesaplar";
import { hataMetni } from "./hata-metni";

/**
 * Formdan gelen dosyaları denetleyip kaydeder.
 *
 * Denetim SUNUCUDA tekrar yapılıyor: tarayıcıdaki `accept` ve boyut kontrolü
 * yalnızca kolaylık, geliştirici araçlarından kaldırılabilir. Tek bir dosya
 * bile kuralı çiğnerse HİÇBİRİ kaydedilmiyor — yarısı yüklenmiş bir başvuru
 * yöneticiye eksik evrakı tam gibi gösterirdi.
 *
 * @returns Hata varsa çevrilmiş mesaj; sorun yoksa `null`.
 */
export async function belgeleriKaydet(
  dosyalar: File[],
  sahipTur: BelgeSahibi,
  sahipId: string,
): Promise<string | null> {
  const gecerliler = dosyalar.filter((d) => d && d.size > 0);
  if (gecerliler.length === 0) return null;
  if (gecerliler.length > AZAMI_ADET) return hataMetni("belge.cokFazla", { adet: AZAMI_ADET });

  for (const dosya of gecerliler) {
    const sonuc = belgeyiDenetle({ type: dosya.type, size: dosya.size, name: dosya.name });
    if (!sonuc.gecerli) {
      return hataMetni(sonuc.sebep, { ad: dosya.name });
    }
  }

  const depo = await hesapDepoAl();
  for (const dosya of gecerliler) {
    const kayit: Belge = {
      id: crypto.randomUUID(),
      sahipTur,
      sahipId,
      // Dosya adı kullanıcıdan geliyor; yol ayırıcıları temizleniyor ve
      // uzunluk sınırlanıyor. İçerik zaten ayrı bir kolonda, ad yalnızca etiket.
      ad: dosya.name.replace(/[\\/]/g, "_").slice(0, 120),
      mime: dosya.type || "application/octet-stream",
      boyut: dosya.size,
      veri: Buffer.from(await dosya.arrayBuffer()),
      tarih: new Date().toISOString(),
    };
    await depo.belgeEkle(kayit);
  }

  return null;
}

/** Formdaki `belge` alanından dosyaları toplar. */
export function formdanBelgeler(formVerisi: FormData): File[] {
  return formVerisi.getAll("belge").filter((d): d is File => d instanceof File);
}
