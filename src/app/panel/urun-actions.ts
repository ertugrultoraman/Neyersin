"use server";

import crypto from "node:crypto";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { urunBul as sabitUrunBul } from "@/content/menuler";
import { bolumBul, VARSAYILAN_BOLUM } from "@/content/mutfak-bolumleri";
import { hesapDepoAl, type MutfakUrunu } from "@/lib/hesaplar";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";

export type UrunDurumu = { hata?: string; basari?: string };

const AD_SINIRI = 80;
const ACIKLAMA_SINIRI = 240;
const BIRIM_SINIRI = 40;
/** Tek ürün için üst sınır — yanlışlıkla 15000 yazılıp menüye düşmesin. */
const FIYAT_TAVANI = 5000;

/**
 * Düzenlenecek mutfağı belirler ve yetkiyi SUNUCUDA doğrular.
 *
 * Şefin gönderdiği `restoranSlug` alanına güvenilmez; kendi mutfağı oturumdan
 * okunur. Yönetici başka bir mutfağı düzenleyebildiği için (Gönül ve Makbule
 * Şef gibi sahibi olmayan profiller yalnızca böyle düzenlenebiliyor) formdaki
 * slug sadece yöneticide dikkate alınır — o da `duzenleyebilirMi`den geçer.
 */
async function hedefMutfak(formVerisi: FormData): Promise<string | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  const istenen =
    oturum.rol === "admin"
      ? String(formVerisi.get("restoranSlug") ?? "").trim()
      : (oturum.restoranSlug ?? "");
  if (!istenen) return null;

  return duzenleyebilirMi(oturum, istenen) ? istenen : null;
}

/** Tarayıcıların güvenle gösterdiği biçimler; SVG kabul edilmiyor (betik taşıyabilir). */
const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AZAMI_GORSEL = 4 * 1024 * 1024;

/**
 * Ürün fotoğrafını Vercel Blob'a (CDN) yükler.
 *
 * Dosya seçilmediyse sessizce geçiyor — form her kaydedildiğinde fotoğraf
 * zorunlu olmamalı. SVG bilerek yasak: içine betik gömülüp tarayıcıda
 * çalıştırılabiliyor.
 */
async function gorselYukle(
  dosya: FormDataEntryValue | null,
  slug: string,
): Promise<{ url?: string; hata?: string }> {
  if (!(dosya instanceof File) || dosya.size === 0) return {};
  if (!IZINLI_TURLER.includes(dosya.type)) {
    return { hata: "Fotoğraf JPG, PNG, WebP veya AVIF olmalı." };
  }
  if (dosya.size > AZAMI_GORSEL) return { hata: "Fotoğraf en fazla 4 MB olabilir." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { hata: "Görsel deposu yapılandırılmadı (BLOB_READ_WRITE_TOKEN eksik)." };
  }

  try {
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/urun/${slug}-${Date.now()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });
    return { url };
  } catch {
    return { hata: "Fotoğraf yüklenemedi, tekrar dene." };
  }
}

/** "180", "180,50", " 180 TL" → 180. Geçersizse 0 (fiyat yakında). */
function fiyatOku(ham: string): number {
  const sayi = Number(ham.replace(/[^\d,.-]/g, "").replace(",", "."));
  if (!Number.isFinite(sayi) || sayi <= 0) return 0;
  return Math.min(Math.round(sayi), FIYAT_TAVANI);
}

function tazele(slug: string) {
  revalidatePath("/panel");
  revalidatePath(`/panel/${slug}`);
  revalidatePath(`/restoran/${slug}`);
  revalidatePath("/admin/urunler");
}

export async function urunKaydetAction(
  _oncekiDurum: UrunDurumu,
  formVerisi: FormData,
): Promise<UrunDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: "Bu mutfağı düzenleme yetkin yok." };

  const ad = String(formVerisi.get("ad") ?? "").trim().slice(0, AD_SINIRI);
  if (ad.length < 2) return { hata: "Ürün adı en az 2 karakter olmalı." };

  const bolumId = String(formVerisi.get("bolum") ?? "");
  const bolum = bolumBul(bolumId)?.id ?? VARSAYILAN_BOLUM;

  const depo = await hesapDepoAl();
  const simdi = new Date().toISOString();
  const duzenlenenId = String(formVerisi.get("id") ?? "").trim();

  /**
   * Düzenlemede ürünün GERÇEKTEN bu mutfağa ait olduğu doğrulanır; aksi hâlde
   * gizli alandaki kimlik değiştirilerek başka bir mutfağın ürünü ele
   * geçirilebilirdi.
   */
  let mevcut: MutfakUrunu | null = null;
  if (duzenlenenId) {
    mevcut = await depo.urunBul(duzenlenenId);
    if (!mevcut || mevcut.restoranSlug !== slug) {
      return { hata: "Düzenlenecek ürün bulunamadı." };
    }
  }

  /*
   * FOTOĞRAF: yeni dosya seçildiyse yüklenir, seçilmediyse eskisi korunur.
   * "Fotoğrafı kaldır" işaretliyse silinir. Yükleme başarısız olursa ürünün
   * geri kalanı yine kaydediliyor — şef bütün formu baştan doldurmasın.
   */
  let gorselUrl = mevcut?.gorselUrl;
  if (formVerisi.get("gorseliKaldir") !== null) {
    gorselUrl = undefined;
  } else {
    const yeni = await gorselYukle(formVerisi.get("gorsel"), slug);
    if (yeni.hata) return { hata: yeni.hata };
    if (yeni.url) gorselUrl = yeni.url;
  }

  const urun: MutfakUrunu = {
    id: mevcut?.id ?? crypto.randomUUID(),
    restoranSlug: slug,
    bolum,
    ad,
    aciklama: String(formVerisi.get("aciklama") ?? "").trim().slice(0, ACIKLAMA_SINIRI),
    fiyat: fiyatOku(String(formVerisi.get("fiyat") ?? "")),
    birim: String(formVerisi.get("birim") ?? "").trim().slice(0, BIRIM_SINIRI) || undefined,
    gorselUrl,
    yayinda: formVerisi.get("yayinda") !== null,
    olusturmaTarihi: mevcut?.olusturmaTarihi ?? simdi,
    guncellemeTarihi: simdi,
  };

  await depo.urunKaydet(urun);
  tazele(slug);

  if (urun.fiyat === 0) {
    return {
      basari: `"${urun.ad}" kaydedildi. Fiyat girilmediği için menüde "fiyat yakında" görünecek, sipariş edilemeyecek.`,
    };
  }
  return { basari: `"${urun.ad}" kaydedildi.` };
}

export async function urunSilAction(
  _oncekiDurum: UrunDurumu,
  formVerisi: FormData,
): Promise<UrunDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: "Bu mutfağı düzenleme yetkin yok." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const depo = await hesapDepoAl();
  const urun = await depo.urunBul(id);
  if (!urun || urun.restoranSlug !== slug) return { hata: "Ürün bulunamadı." };

  await depo.urunSil(id);
  tazele(slug);
  return { basari: `"${urun.ad}" silindi.` };
}

/**
 * YÖNETİCİ TABLOSUNDAN KALDIRMA.
 *
 * İki kaynak, iki davranış:
 *  - Şefin girdiği ürün (veritabanında) → gerçekten silinir.
 *  - Site içeriğindeki ürün (kodda yazılı) → SİLİNEMEZ. Onun yerine aynı
 *    kimlikle "yayında değil" gölge kaydı yazılıp menüden gizleniyor;
 *    kod dosyasına dokunmadan istenince geri açılabiliyor.
 */
export async function urunKaldirAction(
  _oncekiDurum: UrunDurumu,
  formVerisi: FormData,
): Promise<UrunDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: "Bu mutfağı düzenleme yetkin yok." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const depo = await hesapDepoAl();
  const mevcut = await depo.urunBul(id);

  // Veritabanındaki ürün: gerçekten sil.
  if (mevcut) {
    if (mevcut.restoranSlug !== slug) return { hata: "Ürün bu mutfağa ait değil." };
    await depo.urunSil(id);
    tazele(slug);
    return { basari: `"${mevcut.ad}" silindi.` };
  }

  // Sabit menüdeki ürün: gizleyen gölge kaydı oluştur.
  const sabit = sabitUrunBul(slug, id);
  if (!sabit) return { hata: "Ürün bulunamadı." };

  const simdi = new Date().toISOString();
  await depo.urunKaydet({
    id: sabit.id,
    restoranSlug: slug,
    bolum: VARSAYILAN_BOLUM,
    ad: sabit.ad,
    aciklama: sabit.aciklama ?? "",
    fiyat: sabit.fiyat ?? 0,
    birim: sabit.birim,
    yayinda: false,
    sabittenMi: true,
    olusturmaTarihi: simdi,
    guncellemeTarihi: simdi,
  });
  tazele(slug);
  return { basari: `"${sabit.ad}" menüden gizlendi.` };
}

/** Ürünü menüden geçici olarak kaldırır / geri getirir (silmeden). */
export async function urunYayinAction(
  _oncekiDurum: UrunDurumu,
  formVerisi: FormData,
): Promise<UrunDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: "Bu mutfağı düzenleme yetkin yok." };

  const id = String(formVerisi.get("id") ?? "").trim();
  const depo = await hesapDepoAl();
  const urun = await depo.urunBul(id);
  if (!urun || urun.restoranSlug !== slug) return { hata: "Ürün bulunamadı." };

  await depo.urunKaydet({
    ...urun,
    yayinda: !urun.yayinda,
    guncellemeTarihi: new Date().toISOString(),
  });
  tazele(slug);
  return {
    basari: urun.yayinda
      ? `"${urun.ad}" menüden kaldırıldı. İstediğinde geri açabilirsin.`
      : `"${urun.ad}" tekrar menüde.`,
  };
}
