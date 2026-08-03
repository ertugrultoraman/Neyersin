"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { kategoriBul } from "@/content/kategoriler";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type KategoriDurumu = { hata?: string; basari?: string };

/** Tarayıcıların güvenle gösterdiği biçimler; SVG kabul edilmiyor (betik taşıyabilir). */
const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AZAMI_BOYUT = 4 * 1024 * 1024;

async function yoneticiOl() {
  const oturum = await oturumAl();
  if (!oturum || oturum.rol !== "admin") redirect("/admin/giris");
}

/**
 * Kategori fotoğrafı yükler.
 *
 * Dosya Vercel Blob'a (CDN) gidiyor, veritabanında yalnızca adresi tutuluyor.
 * Böylece görsel sunucu diskine yazılmıyor — Vercel'de dosya sistemi geçici
 * olduğu için orada yazılan dosya bir sonraki dağıtımda kaybolurdu.
 *
 * SVG bilerek YASAK: içine betik gömülebiliyor ve tarayıcı onu çalıştırıyor.
 */
export async function kategoriGorseliYukleAction(
  _oncekiDurum: KategoriDurumu,
  formVerisi: FormData,
): Promise<KategoriDurumu> {
  await yoneticiOl();

  const slug = String(formVerisi.get("slug") ?? "").trim();
  if (!kategoriBul(slug)) return { hata: "Kategori bulunamadı." };

  const dosya = formVerisi.get("gorsel");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: "Bir fotoğraf seç." };
  }
  if (!IZINLI_TURLER.includes(dosya.type)) {
    return { hata: "JPG, PNG, WebP veya AVIF olmalı." };
  }
  if (dosya.size > AZAMI_BOYUT) {
    return { hata: "Fotoğraf en fazla 4 MB olabilir." };
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { hata: "Görsel deposu yapılandırılmadı (BLOB_READ_WRITE_TOKEN eksik)." };
  }

  try {
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/kategori/${slug}-${Date.now()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });

    await (await hesapDepoAl()).kategoriGorseliKaydet({
      slug,
      url,
      guncellemeTarihi: new Date().toISOString(),
    });
  } catch {
    return { hata: "Fotoğraf yüklenemedi, tekrar dene." };
  }

  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  return { basari: "Fotoğraf yüklendi." };
}

/** Fotoğrafı kaldırır — kategori yine ikonla görünür. */
export async function kategoriGorseliSilAction(
  _oncekiDurum: KategoriDurumu,
  formVerisi: FormData,
): Promise<KategoriDurumu> {
  await yoneticiOl();

  const slug = String(formVerisi.get("slug") ?? "").trim();
  try {
    await (await hesapDepoAl()).kategoriGorseliSil(slug);
  } catch {
    return { hata: "Kaldırılamadı." };
  }

  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  return { basari: "Fotoğraf kaldırıldı; kategori yine ikonla görünecek." };
}

/** Ana sayfa ve yönetim ekranı için: slug → görsel adresi. */
export async function kategoriGorselleri(): Promise<Map<string, string>> {
  try {
    const liste = await (await hesapDepoAl()).kategoriGorselleriListele();
    return new Map(liste.map((g) => [g.slug, g.url]));
  } catch {
    return new Map();
  }
}
