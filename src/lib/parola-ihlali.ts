import crypto from "node:crypto";

/**
 * SIZMIŞ PAROLA KONTROLÜ (k-anonimlik).
 *
 * Amaç: kullanıcı daha önce bir veri ihlalinde açığa çıkmış bir parola
 * seçtiğinde HESABI AÇMADAN ÖNCE uyarmak. Aksi hâlde kişi hesabını açıyor,
 * sonra tarayıcısı "bu parola sızmış" diye uyarıyor ve iş işten geçmiş
 * oluyor.
 *
 * PAROLA HİÇBİR YERE GÖNDERİLMİYOR:
 * SHA-1 özetinin yalnızca İLK 5 KARAKTERİ sorgulanıyor. Karşı taraf o önekle
 * başlayan binlerce özeti geri yolluyor, eşleşme kontrolü BURADA yapılıyor.
 * Yani ne parola ne de tam özeti dışarı çıkıyor; hangi parolayı sorguladığımız
 * da anlaşılamıyor.
 *
 * SHA-1 burada parola saklamak için değil, servisin veri biçimi öyle olduğu
 * için kullanılıyor. Bizim sakladığımız parola özeti scrypt (bkz. hesaplar/parola.ts).
 */

const UC_NOKTA = "https://api.pwnedpasswords.com/range";
/** Kayıt akışını bekletmemek için kısa tutuluyor. */
const ZAMAN_ASIMI_MS = 2500;

export type IhlalSonucu =
  /** Parola bilinen ihlallerde bulundu — `adet` kaç kez göründüğü. */
  | { durum: "sizmis"; adet: number }
  | { durum: "temiz" }
  /** Servise ulaşılamadı; kayıt ENGELLENMEZ. */
  | { durum: "bilinmiyor" };

export async function parolaIhlalKontrolu(parola: string): Promise<IhlalSonucu> {
  if (!parola || parola.length < 4) return { durum: "bilinmiyor" };

  const ozet = crypto.createHash("sha1").update(parola, "utf8").digest("hex").toUpperCase();
  const onek = ozet.slice(0, 5);
  const kalan = ozet.slice(5);

  try {
    const cevap = await fetch(`${UC_NOKTA}/${onek}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(ZAMAN_ASIMI_MS),
      cache: "no-store",
    });
    if (!cevap.ok) return { durum: "bilinmiyor" };

    const govde = await cevap.text();
    for (const satir of govde.split("\n")) {
      const [son, sayi] = satir.trim().split(":");
      if (son === kalan) {
        const adet = Number(sayi);
        return { durum: "sizmis", adet: Number.isFinite(adet) ? adet : 1 };
      }
    }
    return { durum: "temiz" };
  } catch {
    /*
     * Ağ hatası, zaman aşımı, servis kapalı — hepsi "bilinmiyor".
     * Kayıt AKIŞI DURMUYOR: dış bir servise erişilemedi diye kimse hesap
     * açamaz hâle gelmemeli.
     */
    return { durum: "bilinmiyor" };
  }
}

/** Kullanıcıya gösterilecek uyarı; sızmamışsa boş döner. */
export function ihlalUyarisi(sonuc: IhlalSonucu): string | undefined {
  if (sonuc.durum !== "sizmis") return undefined;
  return (
    "Bu parola daha önce bir veri ihlalinde açığa çıkmış. " +
    "Hesabın güvende olsun diye başka bir parola seçmeni öneririz."
  );
}
