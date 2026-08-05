import { depoAl } from "./depo";
import type { SatisSayimi } from "./depo/tipler";
import { hesapDepoAl } from "./hesaplar";
import { tumRestoranlar } from "./restoran-listesi";
import type { SefRozeti } from "./sef-rozetleri";

/**
 * Şef rozetlerinin sunucu tarafı.
 *
 * Rozetin KİME gideceğine burada karar VERİLMİYOR: o hesap `tumRestoranlar()`
 * içinde, puan hesabıyla aynı yerde yapılıyor (bkz. restoran-listesi.ts).
 * Buradaki işlevler o listeyi okuyup istenen biçime sokuyor. Tek karar noktası
 * olması önemliydi — kart bir kurala, podyum başka bir kurala göre rozet
 * gösterirse hangisinin doğru olduğu anlaşılamaz.
 *
 * Depoya ulaşılamazsa liste zaten rozetsiz dönüyor; podyum boş basamaklarla
 * çizilir, ana sayfa hata vermez.
 */

/** Podyumdaki ilk üç şef, birinciden üçüncüye sıralı. */
export async function sefPodyumunuAl(): Promise<SefRozeti[]> {
  try {
    return (await tumRestoranlar())
      .map((r) => r.sefRozeti)
      .filter((r): r is SefRozeti => Boolean(r))
      .sort((a, b) => a.basamak - b.basamak);
  } catch {
    return [];
  }
}

/** Tek bir mutfağın rozeti (yoksa null) — profil ve şef paneli için. */
export async function sefRozetiAl(slug: string): Promise<SefRozeti | null> {
  try {
    return (await tumRestoranlar()).find((r) => r.slug === slug)?.sefRozeti ?? null;
  } catch {
    return null;
  }
}

/** Yönetici tablosundaki satır — rozetsiz ve ticari mutfaklar da görünür. */
export type SiralamaSatiri = SatisSayimi & {
  /** Şef / ev hanımı mutfağı mı? Rozet yalnızca bunlara veriliyor. */
  sefMutfagiMi: boolean;
  /** Mutfak hâlâ açık mı? Kapanmış mutfağın siparişleri kayıtta kalıyor. */
  mevcutMu: boolean;
  /** Kazandığı basamak — ilk üçte değilse undefined. */
  basamak?: SefRozeti["basamak"];
  /** Meslektaşlarından aldığı Şef Kaşığı sayısı. */
  kasik: number;
};

/**
 * Yönetici için TAM sıralama: rozet alamayan ve ticari mutfaklar dahil.
 *
 * Podyum yalnızca üç ismi gösteriyor; yöneticinin "dördüncü kim, kaç farkla
 * kaçırdı, ticari restoranlar ne durumda" sorusunu cevaplayabilmesi için ham
 * listenin tamamı gerekiyor.
 */
export async function tamSiralamaAl(): Promise<SiralamaSatiri[]> {
  try {
    const [depo, hesapDepo, restoranlar] = await Promise.all([
      depoAl(),
      hesapDepoAl(),
      tumRestoranlar(),
    ]);
    const [sayimlar, kasiklar] = await Promise.all([
      depo.satisSiralamasi(),
      hesapDepo.kasiklariListele(),
    ]);
    const bilgiler = new Map(restoranlar.map((r) => [r.slug, r]));

    const kasikSayisi = new Map<string, number>();
    for (const k of kasiklar) {
      kasikSayisi.set(k.alanSlug, (kasikSayisi.get(k.alanSlug) ?? 0) + 1);
    }

    /*
     * Satış kaydı OLMAYAN ama kaşık almış mutfaklar da listeye giriyor.
     * Yalnızca satış sayımından yürüseydik, hiç sipariş almamış ama
     * meslektaşlarınca takdir edilmiş bir şef yöneticiye hiç görünmezdi.
     */
    const sluglar = new Set([...sayimlar.map((s) => s.restoranSlug), ...kasikSayisi.keys()]);
    const satisHaritasi = new Map(sayimlar.map((s) => [s.restoranSlug, s]));

    return [...sluglar]
      .map((slug) => {
        const restoran = bilgiler.get(slug);
        const satis = satisHaritasi.get(slug);
        return {
          restoranSlug: slug,
          // Mutfak silinmişse sipariş kaydındaki ada düşülüyor; satır kaybolmasın.
          restoranAdi: restoran?.ad ?? satis?.restoranAdi ?? slug,
          adet: satis?.adet ?? 0,
          sefMutfagiMi: Boolean(restoran?.evSefi),
          mevcutMu: Boolean(restoran),
          basamak: restoran?.sefRozeti?.basamak,
          kasik: kasikSayisi.get(slug) ?? 0,
        };
      })
      .sort((a, b) => b.adet - a.adet || a.restoranAdi.localeCompare(b.restoranAdi, "tr-TR"));
  } catch {
    return [];
  }
}
