"use server";

import { cookies } from "next/headers";

import {
  biletUret,
  DOGRULAMA_COOKIE,
  GECERLILIK_GUN,
  girdiyiDenetle,
} from "@/lib/insan-dogrulama";

export type InsanDurumu = { hata?: string; gecti?: boolean };

/**
 * "Ben robot değilim" kutusunun sunucu tarafı.
 *
 * Kanıtlar SUNUCUDA denetleniyor: tarayıcıdaki kutuyu işaretlemek tek başına
 * yetmiyor, bal küpü boş olmalı ve form makul bir sürede gönderilmiş olmalı.
 * Geçerse HMAC imzalı bir bilet çereze yazılıyor; `GECERLILIK_GUN` boyunca
 * tekrar sorulmuyor.
 */
export async function insanDogrulaAction(
  _oncekiDurum: InsanDurumu,
  formVerisi: FormData,
): Promise<InsanDurumu> {
  const sonuc = girdiyiDenetle({
    isaretli: formVerisi.get("insan") !== null,
    balKupu: String(formVerisi.get("eposta_tekrari") ?? ""),
    acilisZamani: String(formVerisi.get("acilis") ?? ""),
  });

  if (!sonuc.gecerli) return { hata: sonuc.hata };

  const cerezler = await cookies();
  cerezler.set(DOGRULAMA_COOKIE, biletUret(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GECERLILIK_GUN * 24 * 60 * 60,
  });

  return { gecti: true };
}
