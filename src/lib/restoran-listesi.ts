import {
  MIN_SEPET,
  restoranBul,
  restoranlar,
  TESLIMAT_BOLGESI,
  TESLIMAT_SURESI,
  type Restoran,
} from "@/content/restoranlar";
import { hesapDepoAl, yorumOzetiHesapla, type SefMutfagi, type Yorum } from "./hesaplar";

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

/**
 * Yeni açılan mutfak için makul varsayılanlar.
 * `puan: 0` — henüz yorumu olmayan mutfak 5,0 ile başlamaz; puan yalnızca
 * gerçek değerlendirmelerden gelir (bkz. `yorumlariUygula`).
 */
const YENI_MUTFAK_VARSAYILANLARI = {
  puan: 0,
  yorum: 0,
  sureDk: TESLIMAT_SURESI,
  minSepet: MIN_SEPET,
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

/** Yorumlar tek sorguda; depo erişilemezse liste puansız devam eder. */
async function tumYorumlar(): Promise<Yorum[]> {
  try {
    return await (await hesapDepoAl()).yorumlariListele();
  } catch {
    return [];
  }
}

/**
 * Listedeki her mutfağın puanını ve yorum sayısını GERÇEK yorumlardan doldurur.
 *
 * Sabit içerikteki `puan`/`yorum` alanları 0'dır ve öyle kalır; buradaki tek
 * geçiş sayesinde kartlar, sıralamalar ve rozetler uydurma değil gerçek veriyle
 * çalışır. Yorumlar TEK sorguyla çekilip slug'a göre gruplanır — restoran
 * başına ayrı sorgu atılmaz.
 */
function yorumlariUygula(liste: Restoran[], yorumlar: Yorum[]): Restoran[] {
  if (yorumlar.length === 0) return liste;

  const gruplar = new Map<string, Yorum[]>();
  for (const y of yorumlar) {
    const mevcut = gruplar.get(y.restoranSlug);
    if (mevcut) mevcut.push(y);
    else gruplar.set(y.restoranSlug, [y]);
  }

  return liste.map((r) => {
    const restoranYorumlari = gruplar.get(r.slug);
    if (!restoranYorumlari || restoranYorumlari.length === 0) return r;
    const ozet = yorumOzetiHesapla(restoranYorumlari);
    return { ...r, puan: ozet.ortalama, yorum: ozet.adet };
  });
}

/**
 * Sabit + otomatik açılan tüm restoranlar, gerçek puanlarıyla.
 *
 * İki sorgu PARALEL çalışıyor. Önceden art arda gidiyordu: önce mutfaklar
 * çekiliyor, o bitince yorumlar isteniyordu. Veritabanı uzak bir bölgede
 * olduğu için her gidiş-dönüş ~150 ms; sıralı çalıştırmak bu bedeli iki kez
 * ödetiyordu. Birbirlerine bağlı olmadıkları için aynı anda başlatılıyorlar.
 */
export async function tumRestoranlar(): Promise<Restoran[]> {
  const [mutfaklar, yorumlar] = await Promise.all([dinamikMutfaklar(), tumYorumlar()]);
  return yorumlariUygula([...restoranlar, ...mutfaklar], yorumlar);
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
