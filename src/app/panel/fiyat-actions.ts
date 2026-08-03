"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

import { urunBul as sabitUrunBul } from "@/content/menuler";
import { bolumAdindanBul, VARSAYILAN_BOLUM } from "@/content/mutfak-bolumleri";
import { menuBul } from "@/content/menuler";
import { hesapDepoAl, type MutfakUrunu } from "@/lib/hesaplar";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";

export type FiyatDurumu = { hata?: string; basari?: string };

/** Tek ürün için üst sınır — yanlışlıkla 15000 yazılıp menüye düşmesin. */
const FIYAT_TAVANI = 5000;

/** "180", "180,50", " 180 TL" → 180. Geçersizse 0. */
function fiyatOku(ham: string): number {
  const sayi = Number(String(ham).replace(/[^\d,.-]/g, "").replace(",", "."));
  if (!Number.isFinite(sayi) || sayi <= 0) return 0;
  return Math.min(Math.round(sayi), FIYAT_TAVANI);
}

/**
 * Sabit menüdeki ürünün hangi bölüme ait olduğunu bulur.
 *
 * Gölge kayıt oluşturulurken lazım: ürün veritabanına kopyalanınca bölümünü
 * de taşımalı, yoksa menüde yanlış başlığın altına düşer.
 */
function sabitUrununBolumu(restoranSlug: string, urunId: string): string {
  for (const kategori of menuBul(restoranSlug)) {
    if (kategori.urunler.some((u) => u.id === urunId)) {
      return bolumAdindanBul(kategori.ad)?.id ?? VARSAYILAN_BOLUM;
    }
  }
  return VARSAYILAN_BOLUM;
}

/**
 * ŞEF FİYAT TALEBİ — doğrudan uygulanmaz, yönetici onayına düşer.
 *
 * Fiyatı şefin tek başına değiştirmesine izin verilmiyor: fahiş fiyat hem
 * müşteriyi kaçırır hem şef/kurye/sistem arasındaki pay dengesini bozar.
 * Talep `bekleyenFiyat` alanına yazılır; müşteri onaya kadar eski fiyatı
 * görür ve siparişler eski fiyattan hesaplanır.
 *
 * Sabit menüdeki (kodda yazılı) ürünler ilk talepte AYNI KİMLİKLE
 * veritabanına kopyalanır — böylece kod dosyasına dokunmadan yönetilebilir
 * hâle gelirler.
 */
export async function fiyatTalepAction(
  _oncekiDurum: FiyatDurumu,
  formVerisi: FormData,
): Promise<FiyatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Bu işlem için giriş yapman gerekiyor." };

  const slug = String(formVerisi.get("restoranSlug") ?? "").trim();
  const urunId = String(formVerisi.get("urunId") ?? "").trim();
  if (!slug || !urunId) return { hata: "Ürün bulunamadı." };

  // Yetki SUNUCUDA: başkasının mutfağının fiyatı değiştirilemez.
  if (!duzenleyebilirMi(oturum, slug)) {
    return { hata: "Bu mutfağı düzenleme yetkin yok." };
  }

  const yeniFiyat = fiyatOku(String(formVerisi.get("fiyat") ?? ""));
  if (yeniFiyat <= 0) return { hata: "Geçerli bir fiyat gir." };

  const depo = await hesapDepoAl();
  const mevcut = await depo.urunBul(urunId);

  /* Zaten veritabanında olan ürün (şefin kendi eklediği ya da daha önce gölgelenmiş). */
  if (mevcut) {
    if (mevcut.restoranSlug !== slug) return { hata: "Ürün bu mutfağa ait değil." };
    if (mevcut.fiyat === yeniFiyat) {
      return { hata: "Fiyat zaten bu değerde." };
    }
    await depo.urunKaydet({
      ...mevcut,
      bekleyenFiyat: yeniFiyat,
      bekleyenTarih: new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString(),
    });
  } else {
    /* Sabit menüden gelen ürün — ilk kez düzenleniyor, gölgesi oluşturuluyor. */
    const sabit = sabitUrunBul(slug, urunId);
    if (!sabit) return { hata: "Ürün bulunamadı." };
    if (sabit.fiyat === yeniFiyat) return { hata: "Fiyat zaten bu değerde." };

    const simdi = new Date().toISOString();
    const golge: MutfakUrunu = {
      id: sabit.id,
      restoranSlug: slug,
      bolum: sabitUrununBolumu(slug, urunId),
      ad: sabit.ad,
      aciklama: sabit.aciklama ?? "",
      // Yayındaki fiyat DEĞİŞMİYOR; yalnızca talep kaydediliyor.
      fiyat: sabit.fiyat ?? 0,
      bekleyenFiyat: yeniFiyat,
      bekleyenTarih: simdi,
      birim: sabit.birim,
      yayinda: true,
      sabittenMi: true,
      olusturmaTarihi: simdi,
      guncellemeTarihi: simdi,
    };
    await depo.urunKaydet(golge);
  }

  revalidatePath(`/restoran/${slug}`);
  revalidatePath(`/panel/${slug}`);
  revalidatePath("/admin/fiyatlar");
  return {
    basari: `Yeni fiyat ${yeniFiyat} TL olarak onaya gönderildi. Onaylanana kadar eski fiyat geçerli.`,
  };
}

/** Şef kendi talebini geri çekebilir. */
export async function fiyatTalepIptalAction(
  _oncekiDurum: FiyatDurumu,
  formVerisi: FormData,
): Promise<FiyatDurumu> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: "Giriş yapman gerekiyor." };

  const slug = String(formVerisi.get("restoranSlug") ?? "").trim();
  const urunId = String(formVerisi.get("urunId") ?? "").trim();
  if (!duzenleyebilirMi(oturum, slug)) return { hata: "Yetkin yok." };

  const depo = await hesapDepoAl();
  const urun = await depo.urunBul(urunId);
  if (!urun || urun.restoranSlug !== slug) return { hata: "Ürün bulunamadı." };

  await depo.urunKaydet({
    ...urun,
    bekleyenFiyat: undefined,
    bekleyenTarih: undefined,
    guncellemeTarihi: new Date().toISOString(),
  });

  revalidatePath(`/restoran/${slug}`);
  revalidatePath("/admin/fiyatlar");
  return { basari: "Fiyat talebi geri çekildi." };
}

/** Yönetici onay/ret ekranı için: bekleyen bütün fiyat talepleri. */
export async function bekleyenFiyatlar(): Promise<MutfakUrunu[]> {
  try {
    const hepsi = await (await hesapDepoAl()).urunleriListele();
    return hepsi
      .filter((u) => typeof u.bekleyenFiyat === "number")
      .sort((a, b) => (a.bekleyenTarih ?? "").localeCompare(b.bekleyenTarih ?? ""));
  } catch {
    return [];
  }
}
