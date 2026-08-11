"use server";

import crypto from "node:crypto";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type TanitimDurumu = { hata?: string; basari?: string };

/**
 * HAKKIMIZDA TANITIM FOTOĞRAFI — sayfanın başındaki yuvarlak görsel.
 *
 * Neden hesap fotoğrafı değil: yöneticinin `hesaplar` tablosunda kaydı YOK,
 * yöneticilik `ADMIN_EMAILS` + `ADMIN_PASSWORD` ortam değişkenlerinden
 * geliyor (bkz. lib/oturum.ts). Bağlanacak bir hesap satırı olmadığı için
 * görsel anahtarıyla ayrı duruyor.
 *
 * Yükleme düğmesi SAYFANIN KENDİSİNDE, yalnızca yöneticiye görünüyor: aynı
 * yaklaşım mutfak sayfasındaki fiyat düzenlemede de var (FiyatDuzenle).
 * Değişikliğin sonucu düzenlendiği yerde görünüyor, panele gidip gelmiyor.
 */
const ANAHTAR = "hakkimizda-tanitim";

const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AZAMI_BOYUT = 4 * 1024 * 1024;

/** Sayfada gösterilecek adres; yoksa null (silüet yer tutucu çıkar). */
export async function tanitimGorseliAl(): Promise<string | null> {
  try {
    return await (await hesapDepoAl()).siteGorseliAl(ANAHTAR);
  } catch {
    /* Görsel sayfanın süsü — depo susarsa Hakkımızda yine açılmalı. */
    return null;
  }
}

async function yoneticiMi(): Promise<boolean> {
  const oturum = await oturumAl();
  return oturum?.rol === "admin";
}

export async function tanitimGorseliYukleAction(
  _oncekiDurum: TanitimDurumu,
  formVerisi: FormData,
): Promise<TanitimDurumu> {
  if (!(await yoneticiMi())) return { hata: await hataMetni("fotograf.oturumYok") };

  const dosya = formVerisi.get("fotograf");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: await hataMetni("fotograf.sec") };
  }
  if (!IZINLI_TURLER.includes(dosya.type)) return { hata: await hataMetni("fotograf.tur") };
  if (dosya.size > AZAMI_BOYUT) return { hata: await hataMetni("fotograf.buyuk") };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { hata: await hataMetni("fotograf.depoYok") };

  try {
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/site/${ANAHTAR}-${crypto.randomUUID()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });
    await (await hesapDepoAl()).siteGorseliKaydet(ANAHTAR, url);
  } catch (hata) {
    console.error("tanitim fotografi yuklenemedi:", hata);
    return { hata: await hataMetni("fotograf.yuklenemedi") };
  }

  revalidatePath("/hakkimizda");
  return { basari: await hataMetni("fotograf.kaydedildi") };
}

/*
 * Parametresiz: kaldırma tek bir görsele ait, formdan okunacak hiçbir şey yok.
 * `useActionState` eyleme (öncekiDurum, form) geçiriyor ama daha az parametre
 * alan bir işlev de kabul ediliyor — kullanılmayan iki argüman yazmaktansa hiç
 * yazmamak dürüst duruyor.
 */
export async function tanitimGorseliSilAction(): Promise<TanitimDurumu> {
  if (!(await yoneticiMi())) return { hata: await hataMetni("fotograf.oturumYok") };

  try {
    await (await hesapDepoAl()).siteGorseliSil(ANAHTAR);
  } catch {
    return { hata: await hataMetni("fotograf.kaldirilamadi") };
  }

  revalidatePath("/hakkimizda");
  return { basari: await hataMetni("fotograf.kaldirildi") };
}
