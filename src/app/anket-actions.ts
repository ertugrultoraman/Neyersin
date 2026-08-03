"use server";

import crypto from "node:crypto";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { anketSecenegiBul, anketSecenekleri } from "@/content/anket";
import { hesapDepoAl, type AnketOyu } from "@/lib/hesaplar";
import { oturumAl } from "@/lib/oturum";

export type AnketDurumu = { hata?: string; basari?: string };

const MISAFIR_COOKIE = "ny_anket";
const MISAFIR_GUN = 365;

/**
 * Misafir seçmen kimliği.
 *
 * Girişsiz de oy verilebiliyor ama aynı kişi sayfayı yenileyip yüzlerce oy
 * atamamalı. Tarayıcıya rastgele bir kimlik yazılıyor; imzalı olması gerekmiyor
 * çünkü kimseye yetki vermiyor — yalnızca tekrar oyu zorlaştırıyor.
 *
 * Kesin bir koruma değil (çerezi silen tekrar oy verir) ve bilerek öyle:
 * daha sıkısı için girişi zorunlu kılmak gerekirdi, o da katılımı düşürürdü.
 */
async function misafirKimligi(): Promise<string> {
  const kavanoz = await cookies();
  const mevcut = kavanoz.get(MISAFIR_COOKIE)?.value;
  if (mevcut) return mevcut;

  const yeni = `misafir:${crypto.randomUUID()}`;
  kavanoz.set(MISAFIR_COOKIE, yeni, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MISAFIR_GUN * 24 * 60 * 60,
  });
  return yeni;
}

/** Oy veren kim: girişliyse e-postası, değilse misafir kimliği. */
async function secmenKimligi(): Promise<{ secmen: string; ad?: string; girisli: boolean }> {
  const oturum = await oturumAl();
  if (oturum) return { secmen: `hesap:${oturum.eposta}`, ad: oturum.ad, girisli: true };
  return { secmen: await misafirKimligi(), girisli: false };
}

export async function anketOyVerAction(
  _oncekiDurum: AnketDurumu,
  formVerisi: FormData,
): Promise<AnketDurumu> {
  const secenek = String(formVerisi.get("secenek") ?? "").trim();
  if (!anketSecenegiBul(secenek)) return { hata: "Geçerli bir seçenek seç." };

  const { secmen, ad, girisli } = await secmenKimligi();

  const oy: AnketOyu = {
    id: crypto.randomUUID(),
    secmen,
    secenek,
    ad,
    girisli,
    tarih: new Date().toISOString(),
  };

  try {
    await (await hesapDepoAl()).anketOyVer(oy);
  } catch {
    return { hata: "Oyun kaydedilemedi, birazdan tekrar dene." };
  }

  revalidatePath("/");
  revalidatePath("/admin/anket");
  return { basari: "Oyun alındı." };
}

export type AnketSonucu = {
  toplam: number;
  /** Seçenek kimliği → { adet, yuzde } */
  dagilim: { id: string; etiket: string; adet: number; yuzde: number }[];
  /** Bu ziyaretçinin oyu — verdiyse sonuçlar gösterilir. */
  benimOyum?: string;
};

/**
 * Anket sonucu.
 *
 * Yüzdeler HERKESE açık ama yalnızca OY VERDİKTEN SONRA gösteriliyor:
 * önden görmek insanın tercihini etkiliyor (sürü etkisi), sonuç da anlamını
 * yitiriyordu.
 */
export async function anketSonucu(): Promise<AnketSonucu> {
  const bos = {
    toplam: 0,
    dagilim: anketSecenekleri.map((s) => ({ id: s.id, etiket: s.etiket, adet: 0, yuzde: 0 })),
  };

  try {
    const depo = await hesapDepoAl();
    const [oylar, { secmen }] = await Promise.all([depo.anketOylariListele(), secmenKimligi()]);

    const sayim = new Map<string, number>();
    for (const o of oylar) sayim.set(o.secenek, (sayim.get(o.secenek) ?? 0) + 1);

    const toplam = oylar.length;
    return {
      toplam,
      dagilim: anketSecenekleri.map((s) => {
        const adet = sayim.get(s.id) ?? 0;
        return {
          id: s.id,
          etiket: s.etiket,
          adet,
          yuzde: toplam > 0 ? Math.round((adet / toplam) * 100) : 0,
        };
      }),
      benimOyum: oylar.find((o) => o.secmen === secmen)?.secenek,
    };
  } catch {
    return bos;
  }
}
