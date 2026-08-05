import { cache } from "react";

import { depoAl } from "./depo";
import { hesapDepoAl } from "./hesaplar";
import { tumRestoranlar } from "./restoran-listesi";
import type { RozetBasamagi } from "./sef-rozetleri";
import { SIRALAMA_UZUNLUGU, type Olcut } from "./sef-kasigi";

/**
 * ŞEF SIRALAMASI — üç ölçüte göre ilk 20.
 *
 * Podyum yalnızca ilk üçü ve tek ölçütü (sipariş) gösteriyor. Bu katman
 * sıralama sayfasının ihtiyacı olan tam tabloyu üretiyor:
 *
 *   sipariş → teslim edilen sipariş adedi        (emek)
 *   beğeni  → müşteri puanı                       (damak zevki)
 *   kaşık   → başka şeflerin verdiği takdir       (meslektaş gözü)
 *
 * Üçü BİRLİKTE anlamlı: çok satan ama düşük puanlı bir mutfak da, az satan
 * ama meslektaşlarınca beğenilen bir şef de kendi sütununda görünüyor.
 */

export type SiralamaSatiri = {
  sira: number;
  slug: string;
  ad: string;
  semt: string;
  /** Seçili ölçütteki değer — sıralama buna göre. */
  deger: number;
  siparis: number;
  puan: number;
  yorum: number;
  kasik: number;
  /** Podyum rozeti (ilk üç şef) — listede de gösteriliyor. */
  basamak?: RozetBasamagi;
};

/**
 * Ham veriyi tek seferde toplar.
 *
 * `cache()` ile sarılı: sıralama sayfası hem tabloyu hem sekme sayaçlarını
 * çiziyor ve her ölçüt aynı kaynağa ihtiyaç duyuyor — istek başına tek toplama.
 */
const tabloyuTopla = cache(async function tabloyuTopla(): Promise<SiralamaSatiri[]> {
  const [restoranlar, depo, hesapDepo] = await Promise.all([
    tumRestoranlar(),
    depoAl(),
    hesapDepoAl(),
  ]);
  const [satislar, kasiklar] = await Promise.all([
    depo.satisSiralamasi(),
    hesapDepo.kasiklariListele(),
  ]);

  const satisHaritasi = new Map(satislar.map((s) => [s.restoranSlug, s.adet]));
  const kasikHaritasi = new Map<string, number>();
  for (const k of kasiklar) {
    kasikHaritasi.set(k.alanSlug, (kasikHaritasi.get(k.alanSlug) ?? 0) + 1);
  }

  // Yalnızca şef / ev hanımı mutfakları yarışıyor (rozet sistemiyle aynı kural).
  return restoranlar
    .filter((r) => r.evSefi)
    .map((r) => ({
      sira: 0,
      slug: r.slug,
      ad: r.ad,
      semt: r.semt,
      deger: 0,
      siparis: satisHaritasi.get(r.slug) ?? 0,
      puan: r.puan,
      yorum: r.yorum,
      kasik: kasikHaritasi.get(r.slug) ?? 0,
      basamak: r.sefRozeti?.basamak,
    }));
});

/** Seçili ölçütün değerini verir. */
function deger(satir: SiralamaSatiri, olcut: Olcut): number {
  if (olcut === "siparis") return satir.siparis;
  if (olcut === "kasik") return satir.kasik;
  return satir.puan;
}

/**
 * Sıralamayı ölçüte göre üretir.
 *
 * DEĞERİ SIFIR OLAN LİSTEYE GİRMİYOR. Sıfır siparişli ya da hiç kaşık almamış
 * bir şefi "20. sırada" göstermek, kazanılmamış bir yeri kazanılmış gibi
 * sunmak olurdu; bu depoda rozetlerin kuralı zaten "yalnızca doğrulanabilir
 * veri". Beğeni sütununda ayrıca YORUMU OLMAYAN eleniyor — puanı 0 olan
 * mutfak kötü değil, henüz değerlendirilmemiş demek.
 *
 * Eşitlik ada göre bozuluyor; iki şef aynı sayıdayken sayfa her yenilendiğinde
 * yer değiştirmesin.
 */
export async function sefSiralamasi(
  olcut: Olcut,
  limit = SIRALAMA_UZUNLUGU,
): Promise<SiralamaSatiri[]> {
  try {
    const tablo = await tabloyuTopla();
    return tablo
      .map((s) => ({ ...s, deger: deger(s, olcut) }))
      .filter((s) => (olcut === "begeni" ? s.yorum > 0 : s.deger > 0))
      .sort((a, b) => b.deger - a.deger || a.ad.localeCompare(b.ad, "tr-TR"))
      .slice(0, limit)
      .map((s, i) => ({ ...s, sira: i + 1 }));
  } catch {
    // Sıralama süsleyici bir sayfa; veritabanı arızası onu boş göstersin, patlatmasın.
    return [];
  }
}

/** Sekmelerin yanında kaç kayıt olduğunu göstermek için. */
export async function olcutSayilari(): Promise<Record<Olcut, number>> {
  try {
    const tablo = await tabloyuTopla();
    return {
      siparis: tablo.filter((s) => s.siparis > 0).length,
      begeni: tablo.filter((s) => s.yorum > 0).length,
      kasik: tablo.filter((s) => s.kasik > 0).length,
    };
  } catch {
    return { siparis: 0, begeni: 0, kasik: 0 };
  }
}

/** Bir mutfağın aldığı kaşık sayısı ve bu şefin ona kaşık atıp atmadığı. */
export async function kasikDurumu(
  hedefSlug: string,
  kendiSlug?: string,
): Promise<{ adet: number; attimMi: boolean }> {
  try {
    const kasiklar = await (await hesapDepoAl()).kasiklariListele();
    return {
      adet: kasiklar.filter((k) => k.alanSlug === hedefSlug).length,
      attimMi: Boolean(
        kendiSlug && kasiklar.some((k) => k.alanSlug === hedefSlug && k.verenSlug === kendiSlug),
      ),
    };
  } catch {
    return { adet: 0, attimMi: false };
  }
}
