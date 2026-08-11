"use server";

import crypto from "node:crypto";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { hataMetni } from "@/lib/hata-metni";
import { hesapDepoAl } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type FotografDurumu = { hata?: string; basari?: string };

/**
 * PROFİL FOTOĞRAFI — hesabın yüzü.
 *
 * Dosya Vercel Blob'a (CDN) gidiyor, veritabanında yalnızca adresi duruyor;
 * aynı yol ürün ve kategori fotoğraflarında da kullanılıyor. Sunucu diskine
 * yazılmıyor çünkü Vercel'de dosya sistemi geçici — orada yazılan görsel bir
 * sonraki dağıtımda kaybolurdu.
 *
 * SVG bilerek yasak: içine betik gömülüp tarayıcıda çalıştırılabiliyor.
 */
const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const AZAMI_BOYUT = 4 * 1024 * 1024;

/**
 * Fotoğrafı değişecek hesabı belirler — ve yetkiyi SUNUCUDA doğrular.
 *
 * Formdaki adrese güvenilmiyor: sıradan bir kullanıcı için hedef HER ZAMAN
 * oturumun kendi adresi. Aksi hâlde gizli alandaki e-postayı değiştiren biri
 * başkasının profiline fotoğraf koyabilirdi.
 */
async function hedefHesap(formVerisi: FormData): Promise<string | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  if (oturum.rol !== "admin") return oturum.eposta;

  const istenen = String(formVerisi.get("eposta") ?? "").trim().toLowerCase();
  return istenen || oturum.eposta;
}

/** Değişiklik hem hesap sayfasında hem listede görünsün. */
function tazele() {
  revalidatePath("/hesabim");
  revalidatePath("/admin/hesaplar");
}

export async function profilFotografiYukleAction(
  _oncekiDurum: FotografDurumu,
  formVerisi: FormData,
): Promise<FotografDurumu> {
  const eposta = await hedefHesap(formVerisi);
  if (!eposta) return { hata: await hataMetni("fotograf.oturumYok") };

  const dosya = formVerisi.get("fotograf");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { hata: await hataMetni("fotograf.sec") };
  }
  if (!IZINLI_TURLER.includes(dosya.type)) return { hata: await hataMetni("fotograf.tur") };
  if (dosya.size > AZAMI_BOYUT) return { hata: await hataMetni("fotograf.buyuk") };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { hata: await hataMetni("fotograf.depoYok") };

  const depo = await hesapDepoAl();
  if (!(await depo.hesapBul(eposta))) return { hata: await hataMetni("fotograf.hesapYok") };

  try {
    /*
     * Dosya adında e-posta KULLANILMIYOR. Blob adresleri herkese açık ve
     * tahmin edilebilir; adres ele geçse bile kimin hesabı olduğu okunmasın.
     *
     * `crypto` AÇIKÇA içeri alınıyor (bkz. üstteki import). Global `crypto`
     * geliştirmede çalışıyor ama üretim derlemesinde küçültücü onu başka bir
     * şeye bağlıyor ve `randomUUID` çağrısı "a is not a function" diye
     * patlıyordu — hata yalnızca `next build` sonrası görülüyordu.
     */
    const uzanti = dosya.type.split("/")[1] ?? "jpg";
    const { url } = await put(`ny/profil/${crypto.randomUUID()}.${uzanti}`, dosya, {
      access: "public",
      contentType: dosya.type,
    });
    await depo.fotografKaydet(eposta, url);
  } catch (hata) {
    /* Sessiz yutulmuyor: yükleme çuvalladığında sunucu günlüğünde sebebi kalsın. */
    console.error("profil fotografi yuklenemedi:", hata);
    return { hata: await hataMetni("fotograf.yuklenemedi") };
  }

  tazele();
  return { basari: await hataMetni("fotograf.kaydedildi") };
}

/** Fotoğrafı kaldırır — hesap yine adın baş harfleriyle görünür. */
export async function profilFotografiSilAction(
  _oncekiDurum: FotografDurumu,
  formVerisi: FormData,
): Promise<FotografDurumu> {
  const eposta = await hedefHesap(formVerisi);
  if (!eposta) return { hata: await hataMetni("fotograf.oturumYok") };

  try {
    await (await hesapDepoAl()).fotografKaydet(eposta, undefined);
  } catch {
    return { hata: await hataMetni("fotograf.kaldirilamadi") };
  }

  tazele();
  return { basari: await hataMetni("fotograf.kaldirildi") };
}
