import {
  restoranBul,
  restoranlar,
  TESLIMAT_BOLGESI,
  type Restoran,
} from "@/content/restoranlar";
import { hesapDepoAl, type SefMutfagi } from "./hesaplar";

/**
 * Restoran listesinin tek kaynağı.
 *
 * İki yerden beslenir:
 *  1. `content/restoranlar.ts` — elle yazılan sabit kayıtlar.
 *  2. Veritabanı — yönetici bir başvuruyu onayladığında otomatik açılan şef /
 *     ev hanımı mutfakları.
 *
 * Sabit içerik senkron kalır (statik üretim, sipariş doğrulama vb. hâlâ
 * `restoranBul` kullanabilir); yalnızca tam listeye ihtiyaç duyan sayfalar bu
 * asenkron katmanı çağırır.
 */

/** Yeni açılan mutfak için makul varsayılanlar. */
const YENI_MUTFAK_VARSAYILANLARI = {
  puan: 5,
  yorum: 0,
  sureDk: [45, 70] as [number, number],
  minSepet: 100,
  teslimatUcreti: 0,
};

export function mutfagiRestoranaCevir(m: SefMutfagi): Restoran {
  return {
    slug: m.slug,
    ad: m.ad,
    mutfaklar: m.sefTuru === "sef" ? ["Şef Mutfağı"] : ["Ev Yemekleri", "Ev Yapımı"],
    ...YENI_MUTFAK_VARSAYILANLARI,
    etiketler: ["Yeni", "Ev Yapımı"],
    semt: m.semt,
    teslimat: TESLIMAT_BOLGESI,
    evSefi: true,
    sefTuru: m.sefTuru,
  };
}

/** Veritabanına ulaşılamazsa sabit içerikle devam — sayfa yine de açılsın. */
async function dinamikMutfaklar(): Promise<Restoran[]> {
  try {
    const depo = await hesapDepoAl();
    return (await depo.mutfaklariListele()).map(mutfagiRestoranaCevir);
  } catch {
    return [];
  }
}

/** Sabit + otomatik açılan tüm restoranlar. */
export async function tumRestoranlar(): Promise<Restoran[]> {
  return [...restoranlar, ...(await dinamikMutfaklar())];
}

/** Slug'ı önce sabit içerikte, bulunamazsa veritabanında arar. */
export async function restoranCoz(slug: string): Promise<Restoran | undefined> {
  const sabit = restoranBul(slug);
  if (sabit) return sabit;

  try {
    const mutfak = await (await hesapDepoAl()).mutfakBul(slug);
    return mutfak ? mutfagiRestoranaCevir(mutfak) : undefined;
  } catch {
    return undefined;
  }
}

/** Bireysel profiller (şef + ev hanımı), istenirse türe göre süzülür. */
export async function tumSefProfilleri(tur?: "sef" | "ev-hanimi"): Promise<Restoran[]> {
  return (await tumRestoranlar()).filter((r) => r.evSefi && (!tur || r.sefTuru === tur));
}

/**
 * Ada bakarak benzersiz bir slug üretir: "Ayşe Yılmaz" → "ayse-yilmaz".
 * Çakışma olursa sonuna sayı eklenir.
 */
export async function benzersizSlugUret(ad: string): Promise<string> {
  const turkce: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  const temel =
    ad
      .split("")
      .map((h) => turkce[h] ?? h)
      .join("")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "sef";

  const mevcut = new Set((await tumRestoranlar()).map((r) => r.slug));
  if (!mevcut.has(temel)) return temel;

  for (let i = 2; i < 100; i += 1) {
    const aday = `${temel}-${i}`;
    if (!mevcut.has(aday)) return aday;
  }
  return `${temel}-${Date.now()}`;
}
