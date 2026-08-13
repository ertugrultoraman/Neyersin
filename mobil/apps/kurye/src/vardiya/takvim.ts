import type { VardiyaDilimiDto } from "ortak";

/**
 * VARDİYA TAKVİMİ — dilim saatlerinin insan diline çevrilmesi.
 *
 * TELEFONUN YEREL SAATİ kullanılıyor, sunucudaki gibi sabit UTC+3 kaydırması
 * değil (bkz. lib/mobil/kurye.ts → TR_KAYMA_MS). Sunucu UTC'de çalıştığı için
 * orada kaydırma şart; kurye ise Türkiye'de ve telefonu doğru saat diliminde.
 * Burada da sabit kaydırma yazılsaydı, yurt dışına çıkan ya da saatini elle
 * kuran bir cihazda saatler iki kez düzeltilmiş olurdu.
 *
 * KARAR VERİLMİYOR: "yer ayırabilir miyim", "iptal edebilir miyim" sorularının
 * cevabı sunucudan geliyor (bkz. VardiyaDilimiDto). Buradaki hesaplar yalnızca
 * METİN üretiyor; saati şaşmış bir telefonda yanlış bir yazı görünür ama
 * yanlış bir düğme çıkmaz.
 */

const GUN_MS = 86_400_000;

/** Yerel gün başlangıcı — gün karşılaştırmaları saat farkına takılmasın. */
function gunBasi(t: Date): number {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}

/** "Bugün" · "Yarın" · "Cum, 15 Ağu" */
export function gunEtiketi(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";

  const fark = Math.round((gunBasi(t) - gunBasi(new Date())) / GUN_MS);
  if (fark === 0) return "Bugün";
  if (fark === 1) return "Yarın";

  return t.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
}

const saat = (iso: string) =>
  new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

/** "19:00 – 23:00" */
export function saatAraligi(dilim: VardiyaDilimiDto): string {
  return `${saat(dilim.baslangic)} – ${saat(dilim.bitis)}`;
}

/** "4 sa" · "1 sa 30 dk" · "45 dk" */
export function sureYaz(dilim: VardiyaDilimiDto): string {
  const dk = Math.round(
    (new Date(dilim.bitis).getTime() - new Date(dilim.baslangic).getTime()) / 60_000,
  );
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  const kalan = dk % 60;
  return kalan === 0 ? `${sa} sa` : `${sa} sa ${kalan} dk`;
}

/**
 * "Şu an sürüyor" · "2 sa 10 dk sonra" · "18 dk sonra"
 *
 * Saniye yazılmıyor: vardiya planı saatler öncesinden bakılan bir ekran ve
 * saniye hassasiyeti burada bilgi taşımıyor — yalnızca sürekli değişen bir
 * sayı olurdu.
 */
export function baslangicaKalan(dilim: VardiyaDilimiDto): string {
  const fark = new Date(dilim.baslangic).getTime() - Date.now();
  if (fark <= 0) return "Şu an sürüyor";

  const dk = Math.round(fark / 60_000);
  if (dk < 60) return `${dk} dk sonra`;

  const sa = Math.floor(dk / 60);
  if (sa < 24) {
    const kalanDk = dk % 60;
    return kalanDk === 0 ? `${sa} sa sonra` : `${sa} sa ${kalanDk} dk sonra`;
  }
  return `${Math.round(sa / 24)} gün sonra`;
}

/** Kalan yer sayısı — kontenjan dolduysa 0. */
export const kalanYer = (dilim: VardiyaDilimiDto) => Math.max(0, dilim.kontenjan - dilim.dolu);

export type GunGrubu = { anahtar: string; etiket: string; dilimler: VardiyaDilimiDto[] };

/**
 * Dilimleri güne göre gruplar.
 *
 * Gruplama olmadan liste "19:00, 23:00, 09:00, 13:00…" diye akıyordu ve
 * kuryenin hangi satırın hangi güne ait olduğunu anlaması için tarihi her
 * satıra yazmak gerekiyordu. Sıra korunuyor: gelen liste zaten başlangıca
 * göre sıralı.
 */
export function gunlereBol(dilimler: readonly VardiyaDilimiDto[]): GunGrubu[] {
  const gruplar: GunGrubu[] = [];

  for (const dilim of dilimler) {
    const anahtar = String(gunBasi(new Date(dilim.baslangic)));
    const son = gruplar[gruplar.length - 1];
    if (son?.anahtar === anahtar) {
      son.dilimler.push(dilim);
      continue;
    }
    gruplar.push({ anahtar, etiket: gunEtiketi(dilim.baslangic), dilimler: [dilim] });
  }

  return gruplar;
}
