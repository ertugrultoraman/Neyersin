"use server";

import { revalidatePath } from "next/cache";

import { VARSAYILAN_PROGRAM, type HaftaProgrami } from "@/lib/calisma-saatleri";
import { saatleriAl, saatleriKaydet } from "@/lib/calisma-saatleri-depo";
import { hataMetni } from "@/lib/hata-metni";
import { isletmeSahibiMi, oturumAl } from "@/lib/oturum";

export type SaatDurumu = { hata?: string; basari?: string };

/** Elden kapatmanın seçilebilir süreleri — saat cinsinden. */
export const KAPATMA_SURELERI = [1, 2, 4] as const;

/**
 * Yetki: yalnızca kendi mutfağı olan işletme (ve yönetici).
 *
 * Slug OTURUMDAN okunuyor, formdan gelmiyor — form alanına başka bir slug
 * yazan biri o mutfağı kapatabilirdi.
 */
async function kendiSlugu(): Promise<{ slug: string } | { hata: string }> {
  const oturum = await oturumAl();
  if (!oturum) return { hata: await hataMetni("oturum.gerekli") };
  /* Çalışan saatleri kaydıramaz — mutfağı kendi başına kapatabilirdi. */
  if (!isletmeSahibiMi(oturum)) return { hata: await hataMetni("saat.yetkiYok") };
  if (!oturum.restoranSlug) return { hata: await hataMetni("saat.mutfakYok") };
  return { slug: oturum.restoranSlug };
}

function programiOku(formVerisi: FormData): HaftaProgrami {
  return VARSAYILAN_PROGRAM.map((varsayilan, i) => {
    const acilis = String(formVerisi.get(`acilis-${i}`) ?? "").trim();
    const kapanis = String(formVerisi.get(`kapanis-${i}`) ?? "").trim();
    return {
      kapali: formVerisi.get(`kapali-${i}`) !== null,
      /* Boş bırakılan alan varsayılana düşüyor; kayıt yarım kalmasın. */
      acilis: /^\d{1,2}:\d{2}$/.test(acilis) ? acilis : varsayilan.acilis,
      kapanis: /^\d{1,2}:\d{2}$/.test(kapanis) ? kapanis : varsayilan.kapanis,
    };
  });
}

/** Haftalık programı kaydeder. Elden kapatma durumuna DOKUNMUYOR. */
export async function saatleriKaydetAction(
  _oncekiDurum: SaatDurumu,
  formVerisi: FormData,
): Promise<SaatDurumu> {
  const yetki = await kendiSlugu();
  if ("hata" in yetki) return { hata: yetki.hata };

  try {
    /*
     * Mevcut kayıt okunup elden kapatma korunuyor: program kaydetmek
     * "şimdilik kapalıyım"ı iptal etmemeli, ikisi ayrı kararlar.
     */
    const mevcut = await saatleriAl(yetki.slug);
    await saatleriKaydet(yetki.slug, {
      program: programiOku(formVerisi),
      elleKapaliBitis: mevcut?.elleKapaliBitis,
    });
  } catch {
    return { hata: await hataMetni("saat.kaydedilemedi") };
  }

  revalidatePath("/isletme");
  revalidatePath(`/restoran/${yetki.slug}`);
  return { basari: await hataMetni("saat.kaydedildi") };
}

/**
 * "Şimdilik kapat" — seçilen süre kadar sipariş almayı durdurur.
 *
 * Süre dolunca KENDİLİĞİNDEN açılıyor; kalıcı bir düğme olsaydı bir akşam
 * kapatan işletme ertesi gün açmayı unutup sebebini anlamadan siparişsiz
 * kalırdı.
 */
export async function simdilikKapatAction(
  _oncekiDurum: SaatDurumu,
  formVerisi: FormData,
): Promise<SaatDurumu> {
  const yetki = await kendiSlugu();
  if ("hata" in yetki) return { hata: yetki.hata };

  const saat = Number(formVerisi.get("saat"));
  const gecerli = KAPATMA_SURELERI.includes(saat as (typeof KAPATMA_SURELERI)[number]);
  if (!gecerli) return { hata: await hataMetni("saat.gecersizSure") };

  try {
    const mevcut = await saatleriAl(yetki.slug);
    await saatleriKaydet(yetki.slug, {
      program: mevcut?.program ?? VARSAYILAN_PROGRAM,
      elleKapaliBitis: new Date(Date.now() + saat * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    return { hata: await hataMetni("saat.kaydedilemedi") };
  }

  revalidatePath("/isletme");
  revalidatePath(`/restoran/${yetki.slug}`);
  return { basari: await hataMetni("saat.kapatildi", { saat }) };
}

/**
 * Elden kapatmayı süresinden önce iptal eder.
 *
 * `useActionState` önceki durumu ilk argüman olarak veriyor; bu eylem ona
 * bakmıyor ama imzada durması gerekiyor.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- useActionState imzası
export async function hemenAcAction(_oncekiDurum: SaatDurumu): Promise<SaatDurumu> {
  const yetki = await kendiSlugu();
  if ("hata" in yetki) return { hata: yetki.hata };

  try {
    const mevcut = await saatleriAl(yetki.slug);
    await saatleriKaydet(yetki.slug, {
      program: mevcut?.program ?? VARSAYILAN_PROGRAM,
      elleKapaliBitis: undefined,
    });
  } catch {
    return { hata: await hataMetni("saat.kaydedilemedi") };
  }

  revalidatePath("/isletme");
  revalidatePath(`/restoran/${yetki.slug}`);
  return { basari: await hataMetni("saat.acildi") };
}
