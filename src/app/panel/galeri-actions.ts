"use server";

import crypto from "node:crypto";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl } from "@/lib/hesaplar";
import {
  AZAMI_KARE,
  AZAMI_KARE_BOYUTU,
  IZINLI_KARE_TURLERI,
} from "@/lib/mutfak-kare";
import { duzenleyebilirMi, oturumAl } from "@/lib/oturum";

export type GaleriDurumu = { hata?: string; basari?: string };


/**
 * Düzenlenecek mutfağı belirler ve yetkiyi SUNUCUDA doğrular.
 *
 * Slug formdan yalnızca YÖNETİCİ için okunuyor; şefin kendi oturumundaki
 * mutfak kullanılıyor. Aksi hâlde gizli alandaki slug'ı değiştiren biri
 * başkasının profiline fotoğraf koyabilirdi.
 */
async function hedefMutfak(formVerisi: FormData): Promise<string | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  const slug =
    oturum.rol === "admin"
      ? String(formVerisi.get("restoranSlug") ?? "").trim() || oturum.restoranSlug
      : oturum.restoranSlug;

  if (!slug || !duzenleyebilirMi(oturum, slug)) return null;
  return slug;
}

function tazele(slug: string) {
  revalidatePath("/panel");
  revalidatePath(`/restoran/${slug}`);
}

export async function mutfakKaresiYukleAction(
  _oncekiDurum: GaleriDurumu,
  formVerisi: FormData,
): Promise<GaleriDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: await hataMetni("saat.yetkiYok") };

  const dosya = formVerisi.get("kare");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: await hataMetni("fotograf.sec") };
  }
  if (!IZINLI_KARE_TURLERI.includes(dosya.type)) return { hata: await hataMetni("fotograf.tur") };
  if (dosya.size > AZAMI_KARE_BOYUTU) return { hata: await hataMetni("fotograf.buyuk") };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { hata: await hataMetni("fotograf.depoYok") };

  const depo = await hesapDepoAl();
  const profil = await depo.profilAl(slug);
  const mevcut = profil?.galeri ?? [];

  if (mevcut.length >= AZAMI_KARE) {
    return { hata: await hataMetni("profil.kareSinir", { adet: AZAMI_KARE }) };
  }

  try {
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/mutfak/${crypto.randomUUID()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });

    await depo.profilKaydet({
      /*
       * Mevcut profilin ÜSTÜNE yazılıyor: yalnızca galeri alanı değişiyor.
       * Boş bir nesneyle kaydedilseydi biyografi, uzmanlık ve Altın Şef
       * unvanı bir fotoğraf yüklendiği için silinirdi.
       */
      ...(profil ?? { restoranSlug: slug, guncellemeTarihi: new Date().toISOString() }),
      restoranSlug: slug,
      galeri: [...mevcut, url],
      guncellemeTarihi: new Date().toISOString(),
    });
  } catch (hata) {
    console.error("mutfak karesi yuklenemedi:", hata);
    return { hata: await hataMetni("fotograf.yuklenemedi") };
  }

  tazele(slug);
  return { basari: await hataMetni("profil.kareEklendi") };
}

/** Tek kareyi kaldırır; diğerleri ve profilin geri kalanı yerinde kalır. */
export async function mutfakKaresiSilAction(
  _oncekiDurum: GaleriDurumu,
  formVerisi: FormData,
): Promise<GaleriDurumu> {
  const slug = await hedefMutfak(formVerisi);
  if (!slug) return { hata: await hataMetni("saat.yetkiYok") };

  const url = String(formVerisi.get("url") ?? "").trim();
  if (!url) return { hata: await hataMetni("profil.kareSecilmedi") };

  const depo = await hesapDepoAl();
  const profil = await depo.profilAl(slug);
  if (!profil) return { hata: await hataMetni("hata.sefProfiliYok") };

  const kalan = (profil.galeri ?? []).filter((k: string) => k !== url);

  /*
   * Blob'daki dosya SİLİNMİYOR, yalnızca profilden düşüyor. Adres tahmin
   * edilemeyen bir UUID ve kimseye bağlanmıyor; silme çağrısı başarısız
   * olsaydı kare profilde durmaya devam ederdi — kullanıcının gördüğü
   * sonucu, temizlenmemiş bir dosyaya bağlamak yanlış olurdu.
   */
  await depo.profilKaydet({
    ...profil,
    galeri: kalan.length > 0 ? kalan : undefined,
    guncellemeTarihi: new Date().toISOString(),
  });

  tazele(slug);
  return { basari: await hataMetni("profil.kareKaldirildi") };
}
