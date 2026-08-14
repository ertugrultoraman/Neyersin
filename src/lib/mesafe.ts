import { MUTFAK_SEMTI } from "@/content/restoranlar";

/**
 * TESLİMAT MESAFESİ — kuryeye "bu iş kaç km" diyebilmek için.
 *
 * SİPARİŞİN KOORDİNATI YOK. Adres serbest metin: ilçe ve mahalle seçiliyor,
 * gerisi kullanıcının yazdığı açık adres. Kapı koordinatı ancak müşteri
 * haritadan pin bıraktığında ya da adres geokodlandığında oluşacak.
 *
 * O GÜNE KADAR MAHALLE MERKEZİ. Teslimat yalnızca Beylikdüzü'ne yapılıyor
 * (bkz. TESLIMAT_BOLGESI) ve mutfaklar da orada; yani bütün işler tek ilçenin
 * içinde, 1–5 km bandında. Mahalle merkezleri bu bantta doğru tarafı gösterir:
 * kurye "Gürpınar mı Yakuplu mu" farkını görür, sokak farkını görmez.
 *
 * BU YÜZDEN HER YERDE "~" İLE YAZILIYOR ve mahalle tanınmıyorsa hiçbir sayı
 * gösterilmiyor — yanlış bir km, hiç km olmamasından kötü: kurye ona göre iş
 * seçiyor.
 *
 * Gerçek koordinat geldiğinde bu dosyanın yerini geokodlama alacak; çağıran
 * taraflar (`siparisMesafesiKm`) aynı kalacak.
 */

export type Nokta = { enlem: number; boylam: number };

/**
 * Mutfakların ortak konumu — Beylikdüzü merkezi.
 *
 * Mutfak başına adres var (şef profilinde `alimAdresi`) ama koordinatı yok;
 * hepsi aynı ilçede olduğu için tek merkez, mahalle farkından daha küçük bir
 * hata bırakıyor.
 */
export const MUTFAK_KONUMU: Nokta = { enlem: 40.997, boylam: 28.64 };

/**
 * Beylikdüzü mahalleleri ve yaklaşık merkezleri.
 *
 * Anahtarlar `mahalleAnahtari` ile normalleştirilmiş hâlleri: müşteri
 * "Marmara", "Marmara Mah." ya da "MARMARA MAHALLESİ" yazmış olabilir.
 */
const MAHALLE_KONUMLARI: Record<string, Nokta> = {
  gurpinar: { enlem: 41.005, boylam: 28.605 },
  dereagzi: { enlem: 41.01, boylam: 28.617 },
  buyuksehir: { enlem: 41.006, boylam: 28.635 },
  kavakli: { enlem: 41.01, boylam: 28.655 },
  "adnan kahveci": { enlem: 40.997, boylam: 28.64 },
  cumhuriyet: { enlem: 41.0, boylam: 28.652 },
  baris: { enlem: 40.997, boylam: 28.63 },
  marmara: { enlem: 40.988, boylam: 28.635 },
  sahil: { enlem: 40.983, boylam: 28.645 },
  yakuplu: { enlem: 40.995, boylam: 28.67 },
};

/**
 * Kuş uçuşu km — haversine.
 *
 * Beylikdüzü ölçeğinde düz düzlem yaklaşımı da yeterdi; haversine yazılı
 * olması, teslimat bölgesi büyüdüğünde formülün değişmesi gerekmesin diye.
 */
export function havadanKm(a: Nokta, b: Nokta): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dEnlem = rad(b.enlem - a.enlem);
  const dBoylam = rad(b.boylam - a.boylam);
  const h =
    Math.sin(dEnlem / 2) ** 2 +
    Math.cos(rad(a.enlem)) * Math.cos(rad(b.enlem)) * Math.sin(dBoylam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Kuş uçuşunu yol mesafesine çeviren katsayı.
 *
 * Kurye düz çizgide gitmiyor; şehir içinde gerçek yol kuş uçuşunun yaklaşık
 * 1,3 katı. Katsayısız gösterilen mesafe her işte olduğundan kısa görünür ve
 * kurye kabul ettiği işe hep beklediğinden uzun sürede varırdı.
 */
const YOL_KATSAYISI = 1.3;

/** En az bu kadar yazılıyor: aynı mahallede bile bir sokak gidiliyor. */
const EN_KISA_KM = 0.8;

/** "Marmara Mah." → "marmara" */
function mahalleAnahtari(ham: string): string {
  return ham
    .toLocaleLowerCase("tr-TR")
    .replace(/mahallesi|mahalle|mah\.?/g, " ")
    .replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h] ?? h)
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mutfaktan müşteriye yaklaşık yol mesafesi (km, tek ondalık).
 *
 * @returns Mahalle tanınmıyorsa `null` — uydurma bir sayı dönmüyor.
 */
export function siparisMesafesiKm(adres: { ilce: string; mahalle: string }): number | null {
  /* Teslimat bölgesi dışında bir adres varsa (eski kayıt) mesafe konuşulmuyor. */
  if (adres.ilce?.trim() !== MUTFAK_SEMTI) return null;

  const hedef = MAHALLE_KONUMLARI[mahalleAnahtari(adres.mahalle ?? "")];
  if (!hedef) return null;

  const km = Math.max(EN_KISA_KM, havadanKm(MUTFAK_KONUMU, hedef) * YOL_KATSAYISI);
  return Math.round(km * 10) / 10;
}
