"use server";

import { cookies } from "next/headers";

import {
  biletUret,
  DOGRULAMA_COOKIE,
  GECERLILIK_GUN,
  girdiyiDenetle,
} from "@/lib/insan-dogrulama";
import { hataMetni } from "@/lib/hata-metni";
import { botEngelliMi, botIsareti } from "@/lib/bot-engeli";
import { istekIpsi } from "@/lib/oturum";

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
  const ip = await istekIpsi();

  /*
   * Zaten engelliyse hiç denetlemiyoruz. Engel süresi altı ay ve tekrar
   * denemek onu uzatmıyor — botun ne kadar uğraştığının bir önemi yok.
   */
  const engel = await botEngelliMi(ip);
  if (engel.engelli) return { hata: await hataMetni("insanKapisi.engellendi") };

  const sonuc = girdiyiDenetle({
    isaretli: formVerisi.get("insan") !== null,
    balKupu: String(formVerisi.get("eposta_tekrari") ?? ""),
    acilisZamani: String(formVerisi.get("acilis") ?? ""),
  });

  if (!sonuc.gecerli) {
    /*
     * BOT İŞARETİ. Kapı zaten bu gönderimi reddediyor ama eskiden bot hemen
     * tekrar deneyebiliyordu — sonsuz kez. İşaret birikince IP altı ay
     * kapıya alınmıyor (bkz. lib/bot-engeli.ts).
     *
     * "Kutuyu işaretlemedin" bir bot işareti SAYILMIYOR: gerçek insan da
     * unutup gönderebilir ve bunu bota yormak haksızlık olurdu.
     */
    if (sonuc.sebep && sonuc.sebep !== "isaretsiz") {
      const engellendi = await botIsareti(ip, sonuc.sebep);
      if (engellendi) return { hata: await hataMetni("insanKapisi.engellendi") };
    }
    return { hata: await hataMetni(sonuc.hata) };
  }

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
