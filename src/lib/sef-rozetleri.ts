import type { SatisSayimi } from "./depo/tipler";

/**
 * ŞEF ROZETLERİ — en çok sipariş alan üç şefin ödüllendirilmesi.
 *
 * Bu dosya SAF tutulmalı: veritabanına, `next/headers`'a ya da dosya sistemine
 * dokunmaz. Restoran kartı gibi istemci bileşenleri de rozet göstereceği için
 * buradan sunucuya uzanan tek bir import bile bütün derlemeyi bozar. Veriyi
 * çeken taraf `sef-rozetleri-sunucu.ts` (aynı ayrım: `dil.ts` / `dil-sunucu.ts`).
 *
 * ÖLÇÜ: toplam satış adedi (bkz. `satisSayilirMi`). Ciro değil, sipariş sayısı —
 * kullanıcının istediği ölçüt bu. Pahalı menüsü olan mutfak öne geçmesin diye
 * de doğrusu bu: rozet emeği ödüllendiriyor, fiyat etiketini değil.
 *
 * DÖNEM: tüm zamanlar. "Ayın şefi" gibi aylık bir pencere BİLEREK seçilmedi —
 * ayın ilk günü podyum boşalır ve sitenin en üstünde günlerce boş bir kutu
 * durur. Aylık sıfırlama istenirse tek değişiklik `satisSiralamasi`ye tarih
 * filtresi eklemek olur; buradaki hiçbir şey değişmez.
 */

export type RozetBasamagi = 1 | 2 | 3;

export type BasamakTanimi = {
  basamak: RozetBasamagi;
  /** public/rozet altındaki şapka görseli. */
  gorsel: string;
  /** Sözlük anahtarı — "Altın Şapka" / "Golden Hat". */
  adAnahtari: string;
  /** Podyum kutusunun rengi. */
  kutu: string;
  /** Kutunun üstündeki sıra numarasının rengi. */
  numara: string;
};

export const BASAMAKLAR: Record<RozetBasamagi, BasamakTanimi> = {
  1: {
    basamak: 1,
    gorsel: "/rozet/sef-rozeti-altin.png",
    adAnahtari: "sefRozeti.altin",
    kutu: "bg-gradient-to-b from-sari-300 to-sari-500",
    numara: "text-kahve-900",
  },
  2: {
    basamak: 2,
    gorsel: "/rozet/sef-rozeti-gumus.png",
    adAnahtari: "sefRozeti.gumus",
    kutu: "bg-gradient-to-b from-kahve-100 to-kahve-200",
    numara: "text-kahve-700",
  },
  3: {
    basamak: 3,
    gorsel: "/rozet/sef-rozeti-bronz.png",
    adAnahtari: "sefRozeti.bronz",
    kutu: "bg-gradient-to-b from-[#d9a679] to-[#b07d4e]",
    numara: "text-white",
  },
};

/** Podyumdaki soldan sağa dizilim: ikinci — birinci — üçüncü. */
export const PODYUM_SIRASI: RozetBasamagi[] = [2, 1, 3];

export type SefRozeti = {
  basamak: RozetBasamagi;
  slug: string;
  ad: string;
  adet: number;
};

/**
 * Satış sayımlarını ilk üç rozete çevirir.
 *
 * Satışı OLMAYAN mutfak rozet almaz. Listeyi üçe tamamlamak için sıfır satışlı
 * bir şefi podyuma çıkarmak, kimsenin kazanmadığı bir ödülü kazanılmış gibi
 * göstermek olurdu — bu depoda rozetlerin kuralı zaten "yalnızca doğrulanabilir
 * veri" (bkz. RozetSeridi). Podyumun boş kalan basamakları arayüzde soru
 * işaretiyle gösteriliyor.
 */
export function siralamadanRozetler(sayimlar: SatisSayimi[]): SefRozeti[] {
  return sayimlar
    .filter((s) => s.adet > 0)
    .slice(0, 3)
    .map((s, i) => ({
      basamak: (i + 1) as RozetBasamagi,
      slug: s.restoranSlug,
      ad: s.restoranAdi,
      adet: s.adet,
    }));
}

/**
 * "{sayi} sipariş" metninin doğru anahtarı.
 *
 * Türkçede sayıdan sonra çoğul eki yok, İngilizcede var. Tek anahtar
 * kullanıldığında canlıda "1 orders" yazdı. Anahtar seçimi tek yerde
 * olsun diye burada — üç ayrı bileşen aynı kuralı tekrar etmesin.
 */
export function siparisAnahtari(adet: number): string {
  return adet === 1 ? "sefRozeti.siparisTek" : "sefRozeti.siparis";
}

/** Rozetleri slug'a göre aranabilir hâle getirir (kart ve profil için). */
export function rozetHaritasi(rozetler: SefRozeti[]): Map<string, SefRozeti> {
  return new Map(rozetler.map((r) => [r.slug, r]));
}
