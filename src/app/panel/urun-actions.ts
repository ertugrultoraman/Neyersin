"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";

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

  const urun: MutfakUrunu = {
    id: mevcut?.id ?? crypto.randomUUID(),
    restoranSlug: slug,
    bolum,
    ad,
    aciklama: String(formVerisi.get("aciklama") ?? "").trim().slice(0, ACIKLAMA_SINIRI),
    fiyat: fiyatOku(String(formVerisi.get("fiyat") ?? "")),
    birim: String(formVerisi.get("birim") ?? "").trim().slice(0, BIRIM_SINIRI) || undefined,
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
