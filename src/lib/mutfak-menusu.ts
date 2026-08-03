import { menuBul, urunBul as sabitUrunBul, type MenuKategorisi, type Urun } from "@/content/menuler";
import { bolumAdindanBul, bolumCoz, mutfakBolumleri } from "@/content/mutfak-bolumleri";
import { hesapDepoAl, type MutfakUrunu } from "./hesaplar";

/**
 * Bir mutfağın menüsünün TEK kaynağı.
 *
 * İki yerden beslenir ve ikisi de aynı bölümlerde birleşir:
 *  1. `content/menuler.ts` — elle yazılan sabit menüler (restoranlar, marketler).
 *  2. `mutfak_urunleri` tablosu — şefin/ev hanımının kendi panelinden eklediği
 *     ürünler; ev yapımı tereyağı, yoğurt, reçel gibi şeyler buradan gelir.
 *
 * Bölüm sırası her yerde AYNI (bkz. content/mutfak-bolumleri.ts): müşteri
 * "Ana Yemekler"i bir profilde üstte, diğerinde en altta görmüyor.
 */
export type MenuBolumu = MenuKategorisi & {
  /** Bölümün ne içerdiğini anlatan kısa cümle — yalnızca tanımlı bölümlerde var. */
  aciklama?: string;
};

/** Depodaki ürünü menüde gösterilen ürün biçimine çevirir. */
function urunuMenuyeCevir(u: MutfakUrunu): Urun {
  return {
    id: u.id,
    ad: u.ad,
    aciklama: u.aciklama,
    fiyat: u.fiyat,
    birim: u.birim,
    // Fiyatı girilmemiş ürün menüde görünür ama sepete eklenemez.
    taslak: u.fiyat <= 0,
  };
}

/**
 * Bir mutfağın kendi eklediği ürünler. Depoya ulaşılamazsa boş döner — menü
 * sabit içerikle, panel de boş listeyle çalışmaya devam eder, sayfa patlamaz.
 */
export async function mutfakUrunleri(restoranSlug: string): Promise<MutfakUrunu[]> {
  try {
    return await (await hesapDepoAl()).urunleriListele(restoranSlug);
  } catch {
    return [];
  }
}

type Yigin = { ad: string; aciklama?: string; sira: number; urunler: Urun[] };

/**
 * Sabit menü + şef ürünlerini bölümlerine göre birleştirir.
 *
 * @param yayindaOlmayanlarDahil Panelde `true` — şef kapattığı ürünü de görür.
 *   Müşteri tarafında `false`; kapalı ürün profilde hiç görünmez.
 */
export async function mutfakMenusu(
  restoranSlug: string,
  yayindaOlmayanlarDahil = false,
): Promise<MenuBolumu[]> {
  const yiginlar = new Map<string, Yigin>();

  /**
   * Sabit kategoriler. Adı tanımlı bir bölüme denk geliyorsa ("Ana Yemekler")
   * o bölümün sırasını alır ve şefin aynı bölüme eklediği ürünlerle BİRLEŞİR.
   * Denk gelmiyorsa ("Kanatlar", "Yanında İyi Gider") kendi adıyla, kendi
   * sırasında kalır — restoran menülerinin düzeni bozulmuyor.
   */
  const urunler = await mutfakUrunleri(restoranSlug);

  /*
   * GÖLGELEME: şef sabit menüdeki bir ürünün fiyatını değiştirdiğinde o ürün
   * AYNI KİMLİKLE veritabanına kopyalanıyor. Burada kayıt varsa sabit olanın
   * yerine o geçiyor — ürün listede yerinden oynamıyor, sadece içeriği
   * güncelleniyor.
   */
  const golgeler = new Map(urunler.map((u) => [u.id, u]));

  menuBul(restoranSlug).forEach((kategori, index) => {
    const bolum = bolumAdindanBul(kategori.ad);
    const anahtar = bolum ? bolum.id : `sabit:${kategori.ad}`;
    const liste: Urun[] = [];
    for (const sabitUrun of kategori.urunler) {
      const golge = golgeler.get(sabitUrun.id);
      if (!golge) {
        liste.push(sabitUrun);
        continue;
      }
      // Gölge yayından kaldırılmışsa müşteriye hiç çıkmaz.
      if (!yayindaOlmayanlarDahil && !golge.yayinda) continue;
      liste.push(urunuMenuyeCevir(golge));
    }
    yiginlar.set(anahtar, {
      ad: bolum?.ad ?? kategori.ad,
      aciklama: bolum?.aciklama,
      sira: bolum ? bolum.sira : 1000 + index,
      urunler: liste,
    });
  });

  /** Gölgelenmiş ürünler yukarıda yerleştirildi; burada tekrar eklenmemeli. */
  const yerlesenler = new Set(
    menuBul(restoranSlug).flatMap((k) => k.urunler.map((u) => u.id)),
  );

  for (const urun of urunler) {
    if (yerlesenler.has(urun.id)) continue;
    if (!yayindaOlmayanlarDahil && !urun.yayinda) continue;
    const bolum = bolumCoz(urun.bolum);
    const mevcut = yiginlar.get(bolum.id);
    if (mevcut) mevcut.urunler.push(urunuMenuyeCevir(urun));
    else {
      yiginlar.set(bolum.id, {
        ad: bolum.ad,
        aciklama: bolum.aciklama,
        sira: bolum.sira,
        urunler: [urunuMenuyeCevir(urun)],
      });
    }
  }

  return [...yiginlar.values()]
    .filter((y) => y.urunler.length > 0)
    .sort((a, b) => a.sira - b.sira)
    .map(({ ad, aciklama, urunler: liste }) => ({ ad, aciklama, urunler: liste }));
}

/**
 * Sipariş doğrulaması için ürün çözümü — önce sabit menü, sonra şef ürünleri.
 *
 * Ödeme akışı fiyatı BURADAN okur; istemcinin gönderdiği tutara güvenilmez.
 * Yayından kaldırılmış ürün `undefined` döner — kapalı bir ürün sepette kalmış
 * olsa bile sipariş edilemez.
 */
export async function urunCoz(restoranSlug: string, urunId: string): Promise<Urun | undefined> {
  /*
   * ÖNCE veritabanına bakılıyor, sonra sabit menüye.
   *
   * Sıra bilerek böyle: şef sabit bir ürünün fiyatını değiştirdiğinde ürün
   * aynı kimlikle veritabanına kopyalanıyor. Sabit menü önce okunsaydı
   * sipariş ESKİ fiyattan hesaplanır, müşteri profilde gördüğünden başka bir
   * tutar öderdi.
   */
  try {
    const urun = await (await hesapDepoAl()).urunBul(urunId);
    if (urun && urun.restoranSlug === restoranSlug) {
      return urun.yayinda ? urunuMenuyeCevir(urun) : undefined;
    }
  } catch {
    // Depoya ulaşılamıyorsa sabit menüyle devam — sipariş akışı durmasın.
  }

  return sabitUrunBul(restoranSlug, urunId);
}

/** Panelde bölüm seçimi için — ürün sayısıyla birlikte tüm bölümler. */
export function bolumSecenekleri(urunler: MutfakUrunu[]) {
  return mutfakBolumleri.map((b) => ({
    ...b,
    adet: urunler.filter((u) => u.bolum === b.id).length,
  }));
}
